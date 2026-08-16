import { Request, Response } from "express";
import { Subscription } from "../models/Subscription";
import { Notification } from "../models/Notification";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@immversestudios.com";

export const getSubscriptions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const subscriptions = await Subscription.find();
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSubscriptionByEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const email = (req.query.email as string)?.toLowerCase();
    if (!email) {
      res.status(400).json({ message: "Email query parameter required" });
      return;
    }

    let subscription = await Subscription.findOne({ clientEmail: email });

    // If not found, create a fallback active subscription for demo purposes (matching mock behavior)
    if (!subscription) {
      subscription = new Subscription({
        clientEmail: email,
        clientName: email.split("@")[0],
        plan: "yearly",
        status: "active",
        startDate: new Date(),
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      await subscription.save();
    }

    res.json(subscription);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const requestRenewal = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const email = req.body.email?.toLowerCase();
    if (!email) {
      res.status(400).json({ message: "Email required" });
      return;
    }

    const subscription = await Subscription.findOne({ clientEmail: email });
    if (!subscription) {
      res.status(404).json({ message: "Subscription not found" });
      return;
    }

    if (subscription.status === "renewal_requested") {
      res.status(400).json({
        message: "Renewal already requested. Awaiting admin confirmation.",
      });
      return;
    }

    subscription.status = "renewal_requested";
    subscription.renewalRequestedAt = new Date();
    await subscription.save();

    // Create notifications for admin and client
    try {
      await Notification.create([
        {
          recipientEmail: ADMIN_EMAIL.toLowerCase(),
          title: "Subscription Renewal Requested",
          message: `${subscription.clientName} (${subscription.clientEmail}) requested a subscription renewal for their ${subscription.plan} plan.`,
          type: "warning",
          link: "/admin/subscriptions",
          read: false,
        },
        {
          recipientEmail: subscription.clientEmail,
          title: "Renewal Request Submitted",
          message: `Your renewal request for the ${subscription.plan} plan has been received. Admin confirmation is pending.`,
          type: "info",
          link: "/dashboard",
          read: false,
        },
      ]);
    } catch (notifErr) {
      console.error("Failed to generate renewal notification:", notifErr);
    }

    res.json(subscription);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const confirmRenewal = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      res.status(404).json({ message: "Subscription not found" });
      return;
    }

    const currentRenewal = new Date(subscription.renewalDate);
    const baseDate = currentRenewal < new Date() ? new Date() : currentRenewal;
    const newRenewalDate = new Date(baseDate);

    if (subscription.plan === "yearly") {
      newRenewalDate.setFullYear(newRenewalDate.getFullYear() + 1);
    } else {
      newRenewalDate.setMonth(newRenewalDate.getMonth() + 1);
    }

    subscription.status = "active";
    subscription.renewalDate = newRenewalDate;
    subscription.renewalRequestedAt = undefined;

    await subscription.save();

    // Create notification for client
    try {
      await Notification.create({
        recipientEmail: subscription.clientEmail,
        title: "Subscription Renewed",
        message: `Your ${subscription.plan} subscription has been confirmed and extended to ${newRenewalDate.toISOString().split("T")[0]}.`,
        type: "success",
        link: "/dashboard",
        read: false,
      });
    } catch (notifErr) {
      console.error("Failed to generate confirmation notification:", notifErr);
    }

    res.json(subscription);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateSubscription = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { plan, status, renewalDate } = req.body;
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      res.status(404).json({ message: "Subscription not found" });
      return;
    }

    if (plan) subscription.plan = plan;
    if (status) subscription.status = status;
    if (renewalDate) subscription.renewalDate = new Date(renewalDate);

    await subscription.save();

    // Create notification for client
    try {
      await Notification.create({
        recipientEmail: subscription.clientEmail,
        title: "Subscription Plan Updated",
        message: `Your subscription has been updated: ${subscription.plan} plan (${subscription.status}).`,
        type: "info",
        link: "/dashboard",
        read: false,
      });
    } catch (notifErr) {
      console.error("Failed to generate update notification:", notifErr);
    }

    res.json(subscription);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
