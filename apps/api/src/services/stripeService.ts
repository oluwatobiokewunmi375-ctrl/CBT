import Stripe from "stripe";
import { PrismaClient, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// ============================================================================
// PLAN DEFINITIONS
// ============================================================================

export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: "free",
    name: "Free",
    price: 0,
    currency: "usd",
    billingCycle: "MONTHLY",
    features: {
      maxUsers: 50,
      maxExams: 5,
      maxQuestionsPerExam: 100,
      maxStorage: 512, // MB
      enableVideoProctoring: false,
      enableCustomBranding: false,
      enableAPI: false,
      enableAdvancedAnalytics: false,
    },
    stripePriceId: null,
    description: "Perfect for getting started",
  },
  BASIC: {
    id: "basic",
    name: "Basic",
    price: 2999, // $29.99 per month
    currency: "usd",
    billingCycle: "MONTHLY",
    features: {
      maxUsers: 500,
      maxExams: 50,
      maxQuestionsPerExam: 500,
      maxStorage: 5120, // MB
      enableVideoProctoring: false,
      enableCustomBranding: false,
      enableAPI: true,
      enableAdvancedAnalytics: true,
    },
    stripePriceId: process.env.STRIPE_PRICE_BASIC_MONTHLY,
    description: "For growing schools",
  },
  PREMIUM: {
    id: "premium",
    name: "Premium",
    price: 9999, // $99.99 per month
    currency: "usd",
    billingCycle: "MONTHLY",
    features: {
      maxUsers: 5000,
      maxExams: 500,
      maxQuestionsPerExam: 5000,
      maxStorage: 51200, // MB
      enableVideoProctoring: true,
      enableCustomBranding: true,
      enableAPI: true,
      enableAdvancedAnalytics: true,
    },
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    description: "For large institutions",
  },
} as const;

// ============================================================================
// CUSTOMER MANAGEMENT
// ============================================================================

/**
 * Get or create Stripe customer
 */
export const getOrCreateStripeCustomer = async (
  schoolId: string,
  email: string,
  name: string
): Promise<string> => {
  // Check if school already has a Stripe customer ID
  const subscription = await prisma.subscription.findUnique({
    where: { schoolId },
  });

  if (subscription?.stripeCustomerId) {
    return subscription.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      schoolId,
    },
  });

  // Save customer ID
  if (subscription) {
    await prisma.subscription.update({
      where: { schoolId },
      data: { stripeCustomerId: customer.id },
    });
  }

  return customer.id;
};

// ============================================================================
// CHECKOUT SESSION
// ============================================================================

/**
 * Create Stripe checkout session
 */
export const createCheckoutSession = async (
  schoolId: string,
  email: string,
  schoolName: string,
  planId: keyof typeof SUBSCRIPTION_PLANS,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string | null }> => {
  const plan = SUBSCRIPTION_PLANS[planId];

  if (!plan.stripePriceId && planId !== "FREE") {
    throw new Error(`Stripe price ID not configured for ${planId} plan`);
  }

  // Get or create customer
  const customerId = await getOrCreateStripeCustomer(
    schoolId,
    email,
    schoolName
  );

  // For free plan, skip Stripe
  if (planId === "FREE") {
    // Update subscription directly
    await prisma.subscription.upsert({
      where: { schoolId },
      create: {
        schoolId,
        plan: "FREE",
        status: "ACTIVE",
        maxUsers: plan.features.maxUsers,
        maxExams: plan.features.maxExams,
        maxQuestionsPerExam: plan.features.maxQuestionsPerExam,
        maxStorage: plan.features.maxStorage,
        enableVideoProctoring: plan.features.enableVideoProctoring,
        enableCustomBranding: plan.features.enableCustomBranding,
        enableAPI: plan.features.enableAPI,
        amount: 0,
        startDate: new Date(),
        autoRenew: true,
      },
      update: {
        plan: "FREE",
        status: "ACTIVE",
        maxUsers: plan.features.maxUsers,
        maxExams: plan.features.maxExams,
        maxQuestionsPerExam: plan.features.maxQuestionsPerExam,
        maxStorage: plan.features.maxStorage,
      },
    });

    return { sessionId: "free_plan", url: null };
  }

  // Create checkout session for paid plans
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: plan.stripePriceId!,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      schoolId,
      planId,
    },
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
};

// ============================================================================
// WEBHOOK HANDLERS
// ============================================================================

/**
 * Handle Stripe webhook events
 */
export const handleStripeWebhook = async (event: Stripe.Event) => {
  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutSessionCompleted(
        event.data.object as Stripe.Checkout.Session
      );

    case "customer.subscription.created":
      return handleSubscriptionCreated(event.data.object as Stripe.Subscription);

    case "customer.subscription.updated":
      return handleSubscriptionUpdated(event.data.object as Stripe.Subscription);

    case "customer.subscription.deleted":
      return handleSubscriptionDeleted(event.data.object as Stripe.Subscription);

    case "invoice.payment_succeeded":
      return handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);

    case "invoice.payment_failed":
      return handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};

/**
 * Handle checkout session completion
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const schoolId = session.metadata?.schoolId;
  const planId = session.metadata?.planId as keyof typeof SUBSCRIPTION_PLANS;

  if (!schoolId || !planId) {
    console.error("Missing metadata in checkout session");
    return;
  }

  const plan = SUBSCRIPTION_PLANS[planId];

  // Update subscription in database
  await prisma.subscription.upsert({
    where: { schoolId },
    create: {
      schoolId,
      plan: planId as SubscriptionPlan,
      status: "ACTIVE",
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      maxUsers: plan.features.maxUsers,
      maxExams: plan.features.maxExams,
      maxQuestionsPerExam: plan.features.maxQuestionsPerExam,
      maxStorage: plan.features.maxStorage,
      enableVideoProctoring: plan.features.enableVideoProctoring,
      enableCustomBranding: plan.features.enableCustomBranding,
      enableAPI: plan.features.enableAPI,
      amount: plan.price / 100,
      currency: plan.currency,
      startDate: new Date(),
      autoRenew: true,
    },
    update: {
      plan: planId as SubscriptionPlan,
      status: "ACTIVE",
      stripeSubscriptionId: session.subscription as string,
      maxUsers: plan.features.maxUsers,
      maxExams: plan.features.maxExams,
      maxQuestionsPerExam: plan.features.maxQuestionsPerExam,
      maxStorage: plan.features.maxStorage,
      enableVideoProctoring: plan.features.enableVideoProctoring,
      enableCustomBranding: plan.features.enableCustomBranding,
      enableAPI: plan.features.enableAPI,
      amount: plan.price / 100,
    },
  });

  console.log(`✓ Subscription activated for school: ${schoolId}`);
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const schoolId = subscription.metadata?.schoolId;

  if (!schoolId) return;

  await prisma.subscription.update({
    where: { schoolId },
    data: {
      stripeSubscriptionId: subscription.id,
      status: "ACTIVE",
      renewalDate: new Date(subscription.current_period_end * 1000),
    },
  });

  console.log(`✓ Subscription created: ${subscription.id}`);
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const schoolId = subscription.metadata?.schoolId;

  if (!schoolId) return;

  const currentStatus = subscription.status;

  await prisma.subscription.update({
    where: { schoolId },
    data: {
      status: mapStripeStatusToAppStatus(currentStatus),
      renewalDate: new Date(subscription.current_period_end * 1000),
    },
  });

  console.log(`✓ Subscription updated: ${subscription.id}`);
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const schoolId = subscription.metadata?.schoolId;

  if (!schoolId) return;

  // Downgrade to free plan
  const freePlan = SUBSCRIPTION_PLANS.FREE;

  await prisma.subscription.update({
    where: { schoolId },
    data: {
      plan: "FREE",
      status: "CANCELLED",
      maxUsers: freePlan.features.maxUsers,
      maxExams: freePlan.features.maxExams,
      maxQuestionsPerExam: freePlan.features.maxQuestionsPerExam,
      maxStorage: freePlan.features.maxStorage,
      enableVideoProctoring: false,
      enableCustomBranding: false,
      enableAPI: false,
      cancelledAt: new Date(),
    },
  });

  console.log(`✓ Subscription cancelled: ${subscription.id}`);
}

/**
 * Handle invoice payment succeeded
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (!subscription) return;

  // Create invoice record
  await prisma.invoice.create({
    data: {
      subscriptionId: subscription.id,
      invoiceNumber: invoice.number!,
      subtotal: (invoice.subtotal || 0) / 100,
      tax: (invoice.tax || 0) / 100,
      total: (invoice.total || 0) / 100,
      currency: invoice.currency,
      status: "PAID",
      stripeInvoiceId: invoice.id,
      issuedDate: new Date(invoice.created * 1000),
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : undefined,
      paidDate: new Date(),
    },
  });

  console.log(`✓ Invoice paid: ${invoice.id}`);
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (!subscription) return;

  // Create invoice record with failed status
  await prisma.invoice.create({
    data: {
      subscriptionId: subscription.id,
      invoiceNumber: invoice.number!,
      subtotal: (invoice.subtotal || 0) / 100,
      tax: (invoice.tax || 0) / 100,
      total: (invoice.total || 0) / 100,
      currency: invoice.currency,
      status: "OVERDUE",
      stripeInvoiceId: invoice.id,
      issuedDate: new Date(invoice.created * 1000),
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : undefined,
    },
  });

  console.log(`✗ Invoice payment failed: ${invoice.id}`);
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Get subscription details
 */
export const getSubscription = async (schoolId: string) => {
  const subscription = await prisma.subscription.findUnique({
    where: { schoolId },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      invoices: {
        orderBy: { issuedDate: "desc" },
        take: 10,
      },
    },
  });

  return subscription;
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (schoolId: string) => {
  const subscription = await prisma.subscription.findUnique({
    where: { schoolId },
  });

  if (!subscription?.stripeSubscriptionId) {
    throw new Error("No active Stripe subscription");
  }

  // Cancel Stripe subscription
  await stripe.subscriptions.del(subscription.stripeSubscriptionId);

  // Update database
  await prisma.subscription.update({
    where: { schoolId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
  });

  return { message: "Subscription cancelled" };
};

/**
 * Update subscription plan
 */
export const updateSubscriptionPlan = async (
  schoolId: string,
  newPlanId: keyof typeof SUBSCRIPTION_PLANS
) => {
  const subscription = await prisma.subscription.findUnique({
    where: { schoolId },
  });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  const newPlan = SUBSCRIPTION_PLANS[newPlanId];

  if (!newPlan.stripePriceId && newPlanId !== "FREE") {
    throw new Error("Invalid plan");
  }

  // If upgrading/downgrading to a paid plan
  if (newPlanId !== "FREE" && subscription.stripeSubscriptionId) {
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [
        {
          id: stripeSubscription.items.data[0].id,
          price: newPlan.stripePriceId!,
        },
      ],
    });
  }

  // Update database
  await prisma.subscription.update({
    where: { schoolId },
    data: {
      plan: newPlanId as SubscriptionPlan,
      maxUsers: newPlan.features.maxUsers,
      maxExams: newPlan.features.maxExams,
      maxQuestionsPerExam: newPlan.features.maxQuestionsPerExam,
      maxStorage: newPlan.features.maxStorage,
      enableVideoProctoring: newPlan.features.enableVideoProctoring,
      enableCustomBranding: newPlan.features.enableCustomBranding,
      enableAPI: newPlan.features.enableAPI,
      amount: newPlan.price / 100,
    },
  });

  return { message: "Plan updated successfully" };
};

// ============================================================================
// USAGE TRACKING & LIMITS ENFORCEMENT
// ============================================================================

/**
 * Check if school can create an exam
 */
export const canCreateExam = async (schoolId: string): Promise<boolean> => {
  const subscription = await prisma.subscription.findUnique({
    where: { schoolId },
  });

  if (!subscription) {
    return false;
  }

  const examCount = await prisma.exam.count({
    where: { schoolId, deletedAt: null },
  });

  return examCount < subscription.maxExams;
};

/**
 * Check if school can add questions to exam
 */
export const canAddQuestions = async (
  examId: string,
  questionCount: number
): Promise<boolean> => {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
  });

  if (!exam) return false;

  const subscription = await prisma.subscription.findUnique({
    where: { schoolId: exam.schoolId },
  });

  if (!subscription) return false;

  const currentQuestionCount = await prisma.question.count({
    where: { examId, deletedAt: null },
  });

  return currentQuestionCount + questionCount <= subscription.maxQuestionsPerExam;
};

/**
 * Check if school can add users
 */
export const canAddUser = async (schoolId: string): Promise<boolean> => {
  const subscription = await prisma.subscription.findUnique({
    where: { schoolId },
  });

  if (!subscription) {
    return false;
  }

  const userCount = await prisma.user.count({
    where: { schoolId, deletedAt: null },
  });

  return userCount < subscription.maxUsers;
};

/**
 * Get usage stats for school
 */
export const getUsageStats = async (schoolId: string) => {
  const subscription = await prisma.subscription.findUnique({
    where: { schoolId },
  });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  const [userCount, examCount, studentAnswerCount] = await Promise.all([
    prisma.user.count({
      where: { schoolId, deletedAt: null },
    }),
    prisma.exam.count({
      where: { schoolId, deletedAt: null },
    }),
    prisma.studentAnswer.count({
      where: {
        submission: { schoolId },
      },
    }),
  ]);

  const examIds = (
    await prisma.exam.findMany({
      where: { schoolId },
      select: { id: true },
    })
  ).map((e) => e.id);

  let totalQuestions = 0;
  if (examIds.length > 0) {
    const result = await prisma.question.aggregate({
      where: {
        examId: { in: examIds },
        deletedAt: null,
      },
      _count: true,
    });
    totalQuestions = result._count;
  }

  return {
    users: {
      used: userCount,
      limit: subscription.maxUsers,
      percentage: Math.round((userCount / subscription.maxUsers) * 100),
    },
    exams: {
      used: examCount,
      limit: subscription.maxExams,
      percentage: Math.round((examCount / subscription.maxExams) * 100),
    },
    questions: {
      used: totalQuestions,
      limit: subscription.maxQuestionsPerExam * subscription.maxExams,
      percentage: Math.round(
        (totalQuestions / (subscription.maxQuestionsPerExam * subscription.maxExams)) * 100
      ),
    },
    features: {
      videoProctoring: subscription.enableVideoProctoring,
      customBranding: subscription.enableCustomBranding,
      api: subscription.enableAPI,
      advancedAnalytics: subscription.enableAdvancedAnalytics,
    },
  };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapStripeStatusToAppStatus(
  stripeStatus: string
): SubscriptionStatus {
  switch (stripeStatus) {
    case "active":
      return "ACTIVE";
    case "past_due":
      return "SUSPENDED";
    case "canceled":
      return "CANCELLED";
    case "unpaid":
      return "SUSPENDED";
    default:
      return "INACTIVE";
  }
}