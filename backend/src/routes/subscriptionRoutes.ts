import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";
import {
  getSubscriptions,
  getSubscriptionByEmail,
  requestRenewal,
  confirmRenewal,
  updateSubscription,
} from "../controllers/subscriptionController";

const router = Router();

router.use(authenticate);

// Admin routes
router.get("/", requireAdmin, getSubscriptions);
router.post("/:id/confirm-renewal", requireAdmin, confirmRenewal);
router.patch("/:id", requireAdmin, updateSubscription);

// Client/Mixed routes
router.get("/client", getSubscriptionByEmail);
router.post("/request-renewal", requestRenewal);

export default router;
