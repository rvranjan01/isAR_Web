import { Subscription } from "@/types";
import { fetchClient, isMockMode } from "./api";
import { INITIAL_SUBSCRIPTIONS } from "./mocks/data";
import { notificationService } from "./notificationService";

let mockSubscriptions: Subscription[] = [...INITIAL_SUBSCRIPTIONS];

export const subscriptionService = {
  async getSubscriptions(): Promise<Subscription[]> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 250));
      return [...mockSubscriptions];
    }
    return fetchClient<Subscription[]>("/api/subscriptions");
  },

  async getSubscriptionByEmail(
    clientEmail: string,
  ): Promise<Subscription | null> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 200));
      const normalized = clientEmail.toLowerCase();
      const sub = mockSubscriptions.find(
        (s) => s.clientEmail.toLowerCase() === normalized,
      );
      if (sub) return sub;

      // Dynamic fallback subscription for new mock clients
      const defaultSub: Subscription = {
        id: `sub-${Date.now()}`,
        clientEmail,
        clientName: clientEmail.split("@")[0],
        plan: "yearly",
        status: "active",
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        startDate: new Date().toISOString().split("T")[0],
      };
      mockSubscriptions.push(defaultSub);
      return defaultSub;
    }
    return fetchClient<Subscription>(
      `/api/subscriptions/client?email=${encodeURIComponent(clientEmail)}`,
    );
  },

  /**
   * CLIENT-FACING: Request subscription renewal.
   * Sets status → 'renewal_requested' and stamps renewalRequestedAt.
   * Admin must confirm before any changes take effect.
   * NOTE: This method does NOT allow the client to change the `plan` field.
   */
  async requestRenewal(clientEmail: string): Promise<Subscription> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 400));
      const normalized = clientEmail.toLowerCase();
      const index = mockSubscriptions.findIndex(
        (s) => s.clientEmail.toLowerCase() === normalized,
      );
      if (index === -1) throw new Error("Subscription not found");

      const current = mockSubscriptions[index];
      if (current.status === "renewal_requested") {
        throw new Error(
          "Renewal already requested. Awaiting admin confirmation.",
        );
      }

      const updated: Subscription = {
        ...current,
        status: "renewal_requested",
        renewalRequestedAt: new Date().toISOString(),
      };
      mockSubscriptions[index] = updated;

      notificationService.addNotification({
        recipientEmail: "admin@immversestudios.com",
        title: "Subscription Renewal Requested",
        message: `${current.clientName} (${current.clientEmail}) requested plan renewal.`,
        type: "warning",
        link: "/admin/subscriptions",
      });

      notificationService.addNotification({
        recipientEmail: current.clientEmail,
        title: "Renewal Request Submitted",
        message: "Your subscription renewal request has been sent for admin approval.",
        type: "info",
        link: "/dashboard",
      });

      return updated;
    }
    return fetchClient<Subscription>("/api/subscriptions/request-renewal", {
      method: "POST",
      body: JSON.stringify({ email: clientEmail }),
    });
  },

  /**
   * ADMIN-ONLY: Confirm a pending renewal request.
   * Extends renewalDate by the subscription's existing plan interval (1mo / 1yr).
   * Resets status → 'active'. Does NOT change the plan field.
   */
  async confirmRenewal(id: string): Promise<Subscription> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 450));
      const index = mockSubscriptions.findIndex((s) => s.id === id);
      if (index === -1) throw new Error("Subscription not found");

      const current = mockSubscriptions[index];
      const currentRenewal = new Date(current.renewalDate);
      // If renewal date is in the past, extend from today; else extend from current renewal date
      const baseDate =
        currentRenewal < new Date() ? new Date() : currentRenewal;
      const newRenewalDate = new Date(baseDate);

      if (current.plan === "yearly") {
        newRenewalDate.setFullYear(newRenewalDate.getFullYear() + 1);
      } else {
        newRenewalDate.setMonth(newRenewalDate.getMonth() + 1);
      }

      const updated: Subscription = {
        ...current,
        status: "active",
        renewalDate: newRenewalDate.toISOString().split("T")[0],
        renewalRequestedAt: undefined,
      };
      mockSubscriptions[index] = updated;

      notificationService.addNotification({
        recipientEmail: current.clientEmail,
        title: "Subscription Renewed",
        message: `Your ${current.plan} subscription has been renewed until ${updated.renewalDate}.`,
        type: "success",
        link: "/dashboard",
      });

      return updated;
    }

    return fetchClient<Subscription>(
      `/api/subscriptions/${id}/confirm-renewal`,
      {
        method: "POST",
      },
    );
  },

  /**
   * ADMIN-ONLY: Full subscription update (plan, status, renewalDate).
   * Clients must never call this — use requestRenewal() instead.
   */
  async updateSubscription(
    id: string,
    updates: Partial<Pick<Subscription, "plan" | "status" | "renewalDate">>,
  ): Promise<Subscription> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 350));
      const index = mockSubscriptions.findIndex((s) => s.id === id);
      if (index === -1) throw new Error("Subscription not found");

      const updated = {
        ...mockSubscriptions[index],
        ...updates,
      };
      mockSubscriptions[index] = updated;
      return updated;
    }

    return fetchClient<Subscription>(`/api/subscriptions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },
};
