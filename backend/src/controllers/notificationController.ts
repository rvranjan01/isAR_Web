import { Request, Response } from "express";
import { Notification } from "../models/Notification";

export const getNotifications = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const email = (req.query.email as string)?.toLowerCase();
    let query = {};
    if (email) {
      query = { recipientEmail: email };
    }

    const notifications = await Notification.find(query).sort({
      createdAt: -1,
    });
    res.json(notifications);
  } catch (error) {
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
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: "Email required" });
      return;
    }

    await Notification.updateMany(
      { recipientEmail: email.toLowerCase() },
      { read: true },
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
