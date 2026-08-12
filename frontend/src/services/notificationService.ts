import { Notification } from "@/types";
import { fetchClient, isMockMode } from "./api";
import { INITIAL_NOTIFICATIONS } from "./mocks/data";

let mockNotifications: Notification[] = [...INITIAL_NOTIFICATIONS];

export const notificationService = {
  async getNotifications(recipientEmail: string): Promise<Notification[]> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 200));
      const normalized = recipientEmail.toLowerCase();
      return mockNotifications.filter(
        (n) =>
          n.recipientEmail.toLowerCase() === normalized ||
          normalized.includes("admin"),
      );
    }
    return fetchClient<Notification[]>(
      `/api/notifications?email=${encodeURIComponent(recipientEmail)}`,
    );
  },

  async markAsRead(id: string): Promise<void> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 150));
      const index = mockNotifications.findIndex((n) => n.id === id);
      if (index !== -1) {
        mockNotifications[index].read = true;
      }
      return;
    }
    await fetchClient(`/api/notifications/${id}/read`, { method: "POST" });
  },

  async markAllAsRead(recipientEmail: string): Promise<void> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 150));
      const normalized = recipientEmail.toLowerCase();
      mockNotifications = mockNotifications.map((n) =>
        n.recipientEmail.toLowerCase() === normalized
          ? { ...n, read: true }
          : n,
      );
      return;
    }
    await fetchClient(`/api/notifications/read-all`, {
      method: "POST",
      body: JSON.stringify({ email: recipientEmail }),
    });
  },

  /**
   * Create a new in-app notification (used for admin alerts like renewal requests).
   * In mock mode, injects into the in-memory store so admin sees it immediately.
   */
  async addNotification(
    notification: Omit<Notification, "id" | "createdAt" | "read">,
  ): Promise<Notification> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 100));
      const newNotif: Notification = {
        ...notification,
        id: `notif-${Date.now()}`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      mockNotifications.unshift(newNotif);
      return newNotif;
    }
    return fetchClient<Notification>("/api/notifications", {
      method: "POST",
      body: JSON.stringify(notification),
    });
  },
};
