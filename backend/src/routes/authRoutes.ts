import { Router } from "express";
import {
  login,
  unlockClient,
  getClientLockStatus,
} from "../controllers/authController";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

router.post("/login", login);
router.post("/unlock", authenticate, requireAdmin, unlockClient);
router.get(
  "/lock-status/:email",
  authenticate,
  requireAdmin,
  getClientLockStatus,
);

export default router;
