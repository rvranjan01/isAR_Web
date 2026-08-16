import { Notification } from "@/types";
import { fetchClient, isMockMode } from "./api";
import { INITIAL_NOTIFICATIONS } from "./mocks/data";

let mockNotifications: Notification[] = [...INITIAL_NOTIFICATIONS];

export const triggerNotificationRefresh = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("immverse:notification_refresh"));
  }
};

export const notificationService = {
  async getNotifications(recipientEmail: string): Promise<Notification[]> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 150));
      const normalized = recipientEmail.toLowerCase();
      return mockNotifications.filter(
        (n) =>
          n.recipientEmail.toLowerCase() === normalized ||
          (normalized.includes("admin") &&
            (n.recipientEmail.toLowerCase() === "admin@immversestudios.com" ||
              n.recipientEmail.toLowerCase() === "admin")),
      );
    }
    return fetchClient<Notification[]>(
      `/api/notifications?email=${encodeURIComponent(recipientEmail)}`,
    );
  },

  async markAsRead(id: string): Promise<void> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 100));
      const index = mockNotifications.findIndex((n) => n.id === id);
      if (index !== -1) {
        mockNotifications[index].read = true;
      }
      triggerNotificationRefresh();
      return;
    }
    await fetchClient(`/api/notifications/${id}/read`, { method: "POST" });
    triggerNotificationRefresh();
  },

  async markAllAsRead(recipientEmail: string): Promise<void> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 100));
      const normalized = recipientEmail.toLowerCase();
      mockNotifications = mockNotifications.map((n) =>
        n.recipientEmail.toLowerCase() === normalized ||
        (normalized.includes("admin") &&
          (n.recipientEmail.toLowerCase() === "admin@immversestudios.com" ||
            n.recipientEmail.toLowerCase() === "admin"))
          ? { ...n, read: true }
          : n,
      );
      triggerNotificationRefresh();
      return;
    }
    await fetchClient(`/api/notifications/mark-all-read`, {
      method: "POST",
      body: JSON.stringify({ email: recipientEmail }),
    });
    triggerNotificationRefresh();
  },

  /**
   * Create a new in-app notification.
   */
  async addNotification(
    notification: Omit<Notification, "id" | "createdAt" | "read">,
  ): Promise<Notification> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 100));
      const newNotif: Notification = {
        ...notification,
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      mockNotifications.unshift(newNotif);
      triggerNotificationRefresh();
      return newNotif;
    }
    const result = await fetchClient<Notification>("/api/notifications", {
      method: "POST",
      body: JSON.stringify(notification),
    });
    triggerNotificationRefresh();
    return result;
  },
};

