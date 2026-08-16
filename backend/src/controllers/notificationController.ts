import { Request, Response } from "express";
import { Notification } from "../models/Notification";
import { AuthRequest } from "../middleware/auth";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@immversestudios.com";

export const getNotifications = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const requestedEmail = (req.query.email as string)?.toLowerCase();
    const user = req.user;
    const email = requestedEmail || user?.email?.toLowerCase();

    let query: Record<string, any> = {};

    if (user?.role === "admin" || (email && (email === ADMIN_EMAIL.toLowerCase() || email.includes("admin")))) {
      query = {
        recipientEmail: {
          $in: [
            ADMIN_EMAIL.toLowerCase(),
            "admin",
            ...(email ? [email] : []),
          ],
        },
      };
    } else if (email) {
      query = { recipientEmail: email };
    }

    const notifications = await Notification.find(query).sort({
      createdAt: -1,
    });
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createNotification = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { recipientEmail, title, message, type, link } = req.body;

    if (!recipientEmail || !title || !message) {
      res.status(400).json({ message: "Missing required notification fields" });
      return;
    }

    const notification = new Notification({
      recipientEmail: recipientEmail.toLowerCase(),
      title,
      message,
      type: type || "info",
      link,
      read: false,
    });

    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markAsRead = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      res.status(404).json({ message: "Notification not found" });
      return;
    }

    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markAllAsRead = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;
    const targetEmail = (email || req.user?.email || "")?.toLowerCase();

    if (!targetEmail) {
      res.status(400).json({ message: "Email required" });
      return;
    }

    if (req.user?.role === "admin" || targetEmail === ADMIN_EMAIL.toLowerCase() || targetEmail.includes("admin")) {
      await Notification.updateMany(
        {
          recipientEmail: {
            $in: [ADMIN_EMAIL.toLowerCase(), "admin", targetEmail],
          },
        },
        { read: true },
      );
    } else {
      await Notification.updateMany(
        { recipientEmail: targetEmail },
        { read: true },
      );
    }

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

