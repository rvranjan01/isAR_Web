import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { Project } from "../models/Project";
import { AuthRequest } from "../middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@immversestudios.com";
const MAX_LOGIN_ATTEMPTS = 3;

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, orderId } = req.body;

    if (!email || !orderId) {
      res.status(400).json({ message: "Email and Order ID are required" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOrderId = orderId.trim().toUpperCase();

    // ── Admin Login ──────────────────────────────────────────────────────────
    const adminUser = await User.findOne({
      email: normalizedEmail,
      role: "admin",
    });
    if (adminUser) {
      if (normalizedOrderId.startsWith("ADMIN")) {
        const token = jwt.sign(
          { id: adminUser._id, role: "admin", email: adminUser.email },
          JWT_SECRET,
          { expiresIn: "1d" },
        );
        res.json({ user: adminUser, token });
        return;
      } else {
        res.status(401).json({ message: "Invalid Admin Order ID" });
        return;
      }
    }

    // ── Client Login ─────────────────────────────────────────────────────────
    let user = await User.findOne({ email: normalizedEmail, role: "client" });

    // Check if account is locked
    if (user && user.isLocked) {
      res.status(403).json({
        locked: true,
        message:
          "Your account has been locked due to too many failed login attempts. Please contact the admin to unlock your account.",
        adminEmail: ADMIN_EMAIL,
      });
      return;
    }

    // Verify order ID belongs to this email
    const project = await Project.findOne({
      clientEmail: normalizedEmail,
      orderId: normalizedOrderId,
    });

    const primaryOrderMatch =
      user && user.orderId?.toUpperCase() === normalizedOrderId;

    if (!project && !primaryOrderMatch) {
      // Wrong order ID — increment failed attempts
      if (user) {
        user.loginAttempts = (user.loginAttempts || 0) + 1;
        const attemptsLeft = MAX_LOGIN_ATTEMPTS - user.loginAttempts;

        if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
          user.isLocked = true;
          await user.save();
          res.status(403).json({
            locked: true,
            message:
              "Your account has been locked due to too many failed login attempts. Please contact the admin to unlock your account.",
            adminEmail: ADMIN_EMAIL,
          });
          return;
        }

        await user.save();
        res.status(401).json({
          message: "Order ID not found for this email address.",
          attemptsLeft,
        });
      } else {
        // Email not registered at all — don't create a lockout record yet
        res.status(401).json({
          message: "Order ID not found for this email address.",
        });
      }
      return;
    }

    // ── Successful login ─────────────────────────────────────────────────────
    // Create user if first-time login via a project order
    if (!user) {
      user = new User({
        email: normalizedEmail,
        role: "client",
        name: project ? project.clientName : normalizedEmail.split("@")[0],
        companyName: "Client Enterprise",
        orderId: normalizedOrderId,
        loginAttempts: 0,
        isLocked: false,
      });
      await user.save();
    } else {
      // Reset failed attempts on successful login
      user.loginAttempts = 0;
      user.isLocked = false;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: "client", email: user.email },
      JWT_SECRET,
      { expiresIn: "1d" },
    );

    const userResponse = user.toJSON();
    userResponse.orderId = normalizedOrderId;

    res.json({ user: userResponse, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ── Admin: Unlock client account ─────────────────────────────────────────────
export const unlockClient = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "Client email is required" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail, role: "client" });

    if (!user) {
      res.status(404).json({ message: "Client not found" });
      return;
    }

    user.isLocked = false;
    user.loginAttempts = 0;
    await user.save();

    res.json({ message: "Account unlocked successfully", email: normalizedEmail });
  } catch (error) {
    console.error("Unlock error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ── Admin: Get client lock status ─────────────────────────────────────────────
export const getClientLockStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const email = req.params['email'] as string;
    const normalizedEmail = decodeURIComponent(email).trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail, role: "client" });

    if (!user) {
      // Client may not have a User record yet (created on first login)
      res.json({ isLocked: false, loginAttempts: 0 });
      return;
    }

    res.json({ isLocked: user.isLocked, loginAttempts: user.loginAttempts });
  } catch (error) {
    console.error("Get lock status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
