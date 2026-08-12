import { AuthResponse, User } from "@/types";
import { fetchClient, isMockMode } from "./api";
import { INITIAL_USERS, INITIAL_PROJECTS } from "./mocks/data";

// ── Custom error for locked accounts ──────────────────────────────────────────
export class AccountLockedError extends Error {
  adminEmail: string;
  constructor(adminEmail: string) {
    super("Account is locked");
    this.name = "AccountLockedError";
    this.adminEmail = adminEmail;
  }
}

// ── Custom error that carries remaining attempts ───────────────────────────────
export class InvalidOrderIdError extends Error {
  attemptsLeft?: number;
  constructor(attemptsLeft?: number) {
    super("Order ID not found for this email address.");
    this.name = "InvalidOrderIdError";
    this.attemptsLeft = attemptsLeft;
  }
}

// In-memory mock session store for mock mode
let mockUsers = [...INITIAL_USERS];

// In-memory failed attempts tracker (mock mode only)  { email -> count }
const mockFailedAttempts: Record<string, number> = {};
const MOCK_MAX_ATTEMPTS = 3;
const MOCK_ADMIN_EMAIL = "admin@immversestudios.com";

export const authService = {
  /**
   * Login requires a valid Email + any Order ID that belongs to that email.
   * Locks the account after 3 consecutive wrong Order ID attempts.
   */
  async login(email: string, orderId: string): Promise<AuthResponse> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 350));

      const normalizedEmail = email.trim().toLowerCase();
      const normalizedOrderId = orderId.trim().toUpperCase();

      // Admin shortcut
      if (
        normalizedEmail.includes("admin") ||
        normalizedOrderId.startsWith("ADMIN")
      ) {
        const adminUser: User = {
          id: "usr-admin-1",
          email: normalizedEmail,
          role: "admin",
          name: "Immverse Studio Operations",
          companyName: "Immverse Studios",
        };
        return {
          user: adminUser,
          token: `mock-jwt-admin-${Date.now()}`,
        };
      }

      // Check mock lock status
      const attempts = mockFailedAttempts[normalizedEmail] ?? 0;
      if (attempts >= MOCK_MAX_ATTEMPTS) {
        throw new AccountLockedError(MOCK_ADMIN_EMAIL);
      }

      const seededUserByEmail = mockUsers.find(
        (u) => u.email.toLowerCase() === normalizedEmail && u.role === "client",
      );

      if (seededUserByEmail) {
        const allProjects = [...INITIAL_PROJECTS];
        const orderBelongsToEmail = allProjects.some(
          (p) =>
            p.clientEmail.toLowerCase() === normalizedEmail &&
            p.orderId.toUpperCase() === normalizedOrderId,
        );
        const primaryOrderMatch =
          seededUserByEmail.orderId?.toUpperCase() === normalizedOrderId;

        if (orderBelongsToEmail || primaryOrderMatch) {
          // Success — reset attempts
          delete mockFailedAttempts[normalizedEmail];
          return {
            user: { ...seededUserByEmail, orderId: normalizedOrderId },
            token: `mock-jwt-client-${seededUserByEmail.id}-${Date.now()}`,
          };
        }

        // Wrong order ID — increment
        mockFailedAttempts[normalizedEmail] =
          (mockFailedAttempts[normalizedEmail] ?? 0) + 1;
        const newAttempts = mockFailedAttempts[normalizedEmail];

        if (newAttempts >= MOCK_MAX_ATTEMPTS) {
          throw new AccountLockedError(MOCK_ADMIN_EMAIL);
        }

        throw new InvalidOrderIdError(MOCK_MAX_ATTEMPTS - newAttempts);
      }

      // Dynamic mock — new email
      const dynamicUser: User = {
        id: `usr-client-${Date.now()}`,
        email: normalizedEmail,
        role: "client",
        name: normalizedEmail.split("@")[0],
        companyName: "Client Enterprise",
        orderId: normalizedOrderId,
      };
      mockUsers.push(dynamicUser);

      return {
        user: dynamicUser,
        token: `mock-jwt-client-${dynamicUser.id}-${Date.now()}`,
      };
    }

    // ── Real API mode ─────────────────────────────────────────────────────────
    const response = await fetch(
      (import.meta.env.VITE_API_BASE_URL ?? "") + "/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, orderId }),
      },
    );

    const data = await response.json();

    if (response.status === 403 && data.locked) {
      throw new AccountLockedError(data.adminEmail ?? MOCK_ADMIN_EMAIL);
    }

    if (!response.ok) {
      throw new InvalidOrderIdError(data.attemptsLeft);
    }

    return data as AuthResponse;
  },

  async getCurrentUser(): Promise<User | null> {
    const storedUser = localStorage.getItem("immverse_user");
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Admin: unlock a client account by email.
   */
  async unlockClient(email: string): Promise<void> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 300));
      delete mockFailedAttempts[email.trim().toLowerCase()];
      return;
    }

    const token = localStorage.getItem("immverse_auth_token");
    const response = await fetch(
      (import.meta.env.VITE_API_BASE_URL ?? "") + "/api/auth/unlock",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to unlock account");
    }
  },

  /**
   * Admin: get lock status of a client.
   */
  async getLockStatus(
    email: string,
  ): Promise<{ isLocked: boolean; loginAttempts: number }> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 200));
      const attempts = mockFailedAttempts[email.trim().toLowerCase()] ?? 0;
      return {
        isLocked: attempts >= MOCK_MAX_ATTEMPTS,
        loginAttempts: attempts,
      };
    }

    const token = localStorage.getItem("immverse_auth_token");
    const response = await fetch(
      (import.meta.env.VITE_API_BASE_URL ?? "") +
        `/api/auth/lock-status/${encodeURIComponent(email)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!response.ok) throw new Error("Failed to fetch lock status");
    return response.json();
  },
};
