import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController";

const router = Router();

router.use(authenticate);

router.get("/", getNotifications);
router.post("/", createNotification);
router.patch("/:id/read", markAsRead);
router.post("/:id/read", markAsRead);
router.post("/mark-all-read", markAllAsRead);
router.post("/read-all", markAllAsRead);

export default router;

