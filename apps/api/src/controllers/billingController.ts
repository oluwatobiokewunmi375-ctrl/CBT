import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import {
  createCheckoutSession,
  handleStripeWebhook,
  getSubscription,
  cancelSubscription,
  updateSubscriptionPlan,
  getUsageStats,
  SUBSCRIPTION_PLANS,
} from "../services/stripeService";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// ============================================================================
// GET PLANS
// ============================================================================

/**
 * Get all subscription plans
 * GET /api/billing/plans
 */
export const getPlans = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const plans = Object.values(SUBSCRIPTION_PLANS).map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      description: plan.description,
      features: plan.features,
    }));

    res.json(plans);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// CHECKOUT
// ============================================================================

/**
 * Create checkout session
 * POST /api/billing/checkout
 */
export const createCheckout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = (req as any).schoolId;
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: "Plan ID is required" });
    }

    if (!SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    // Get school details
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/billing`;

    const { sessionId, url } = await createCheckoutSession(
      schoolId,
      school.email,
      school.name,
      planId as keyof typeof SUBSCRIPTION_PLANS,
      successUrl,
      cancelUrl
    );

    res.json({
      sessionId,
      url,
      message: planId === "FREE" ? "Free plan activated" : "Checkout session created",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// SUBSCRIPTION DETAILS
// ============================================================================

/**
 * Get subscription details
 * GET /api/billing/subscription
 */
export const getSubscriptionDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = (req as any).schoolId;

    const subscription = await getSubscription(schoolId);

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    res.json(subscription);
  } catch (error) {
    next(error);
  }
};

/**
 * Get usage stats
 * GET /api/billing/usage
 */
export const getUsage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = (req as any).schoolId;

    const usage = await getUsageStats(schoolId);

    res.json(usage);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// UPGRADE/DOWNGRADE/CANCEL
// ============================================================================

/**
 * Update subscription plan
 * POST /api/billing/update-plan
 */
export const updatePlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = (req as any).schoolId;
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: "Plan ID is required" });
    }

    const result = await updateSubscriptionPlan(
      schoolId,
      planId as keyof typeof SUBSCRIPTION_PLANS
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel subscription
 * POST /api/billing/cancel
 */
export const cancel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = (req as any).schoolId;

    const result = await cancelSubscription(schoolId);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// BILLING PORTAL
// ============================================================================

/**
 * Create billing portal session
 * POST /api/billing/portal
 */
export const createPortalSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = (req as any).schoolId;

    const subscription = await getSubscription(schoolId);

    if (!subscription?.stripeCustomerId) {
      return res.status(400).json({ error: "No Stripe customer found" });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// INVOICES
// ============================================================================

/**
 * Get invoices
 * GET /api/billing/invoices
 */
export const getInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = (req as any).schoolId;
    const { page = 1, limit = 20 } = req.query;

    const subscription = await prisma.subscription.findUnique({
      where: { schoolId },
    });

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    const pageNum = parseInt(page as string) || 1;
    const pageSize = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * pageSize;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { subscriptionId: subscription.id },
        orderBy: { issuedDate: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.invoice.count({
        where: { subscriptionId: subscription.id },
      }),
    ]);

    res.json({
      invoices,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// WEBHOOK
// ============================================================================

/**
 * Stripe webhook
 * POST /api/billing/webhook
 */
export const webhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      return res.status(400).json({ error: "No signature" });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Handle webhook
    await handleStripeWebhook(event);

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};