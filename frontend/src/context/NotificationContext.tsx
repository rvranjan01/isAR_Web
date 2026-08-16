import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { Notification, ToastMessage } from "@/types";
import { notificationService } from "@/services/notificationService";
import { useAuth } from "./AuthContext";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const knownNotificationIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef<boolean>(true);

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      knownNotificationIds.current.clear();
      isInitialLoad.current = true;
      return;
    }
    try {
      const data = await notificationService.getNotifications(user.email);
      setNotifications(data);

      if (isInitialLoad.current) {
        data.forEach((n) => knownNotificationIds.current.add(n.id));
        isInitialLoad.current = false;
      } else {
        // Detect newly arrived unread notifications in real time
        const newUnread = data.filter(
          (n) => !n.read && !knownNotificationIds.current.has(n.id),
        );

        if (newUnread.length > 0) {
          newUnread.forEach((n) => {
            knownNotificationIds.current.add(n.id);
            addToast({
              type: n.type || "info",
              title: n.title,
              description: n.message,
            });
          });
        }
      }
    } catch {
      // Ignore background notification fetch errors
    }
  }, [user, addToast]);

  // Real-time listener and periodic polling
  useEffect(() => {
    isInitialLoad.current = true;
    knownNotificationIds.current.clear();
    refreshNotifications();

    if (!user) return;

    // Real-time polling every 4 seconds
    const interval = setInterval(() => {
      refreshNotifications();
    }, 4000);

    // Event listener for in-app real-time triggers
    const handleEvent = () => {
      refreshNotifications();
    };
    window.addEventListener("immverse:notification_refresh", handleEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener("immverse:notification_refresh", handleEvent);
    };
  }, [user, refreshNotifications]);

  const markAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.email);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        addToast,
        removeToast,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};


export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
};
