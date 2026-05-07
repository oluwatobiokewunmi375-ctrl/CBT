import { Router } from "express";
import { authMiddleware, roleMiddleware } from "../middleware/auth";
import {
  getPlans,
  createCheckout,
  getSubscriptionDetails,
  getUsage,
  updatePlan,
  cancel,
  createPortalSession,
  getInvoices,
  webhook,
} from "../controllers/billingController";

const router = Router();

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

// Get all plans (public)
router.get("/plans", getPlans);

// Webhook (must bypass auth)
router.post("/webhook", webhook);

// ============================================================================
// PROTECTED ROUTES
// ============================================================================

router.use(authMiddleware);

// Checkout
router.post("/checkout", createCheckout);

// Get subscription
router.get("/subscription", getSubscriptionDetails);

// Get usage
router.get("/usage", getUsage);

// Update plan
router.post(
  "/update-plan",
  roleMiddleware(["SCHOOL_ADMIN"]),
  updatePlan
);

// Cancel subscription
router.post(
  "/cancel",
  roleMiddleware(["SCHOOL_ADMIN"]),
  cancel
);

// Billing portal
router.post(
  "/portal",
  roleMiddleware(["SCHOOL_ADMIN"]),
  createPortalSession
);

// Get invoices
router.get("/invoices", getInvoices);

export default router;