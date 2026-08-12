import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { loginSchema, LoginFormData } from "@/lib/schema";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import {
  Box,
  Mail,
  KeyRound,
  ArrowRight,
  ExternalLink,
  Lock,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";
import {
  AccountLockedError,
  InvalidOrderIdError,
} from "@/services/authService";

interface LockedInfo {
  adminEmail: string;
}

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockedInfo, setLockedInfo] = useState<LockedInfo | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      orderId: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setAttemptsLeft(null);
    try {
      const user = await login(data.email, data.orderId);
      addToast({
        type: "success",
        title: "Authentication Successful",
        description: `Welcome back, ${user.name || user.email}`,
      });

      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      if (err instanceof AccountLockedError) {
        setLockedInfo({ adminEmail: err.adminEmail });
        setAttemptsLeft(null);
      } else if (err instanceof InvalidOrderIdError) {
        if (err.attemptsLeft !== undefined) {
          setAttemptsLeft(err.attemptsLeft);
        }
        addToast({
          type: "error",
          title: "Login Failed",
          description: err.message,
        });
      } else {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Invalid credentials. Please verify your Email and Order ID.";
        addToast({
          type: "error",
          title: "Login Failed",
          description: errorMessage,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-4 py-12">
        <div className="text-center mb-8">
          <a
            href="https://immversestudios.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full bg-[#2D5BFF]/10 text-[#2D5BFF] text-xs font-semibold hover:bg-[#2D5BFF]/20 transition-colors"
          >
            <Box className="w-4 h-4" />
            <span>Immverse Studios Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-[var(--ink)]">
            Client &amp; Order Portal
          </h1>
          <p className="text-sm text-[var(--ink-soft)] mt-2">
            Enter your email address and Order ID to access your 3D/AR projects
            and status updates.
          </p>
        </div>

        <Card glass glow className="w-full">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              No password required — check your confirmation email for your
              Order ID.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* ── Account Locked Banner ──────────────────────────────────── */}
            {lockedInfo ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20 border border-red-500/30">
                    <Lock className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-red-500 text-sm">
                      Account Locked
                    </p>
                    <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                      Too many failed login attempts
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
                  Your account has been locked after 3 consecutive failed login
                  attempts. Please contact the admin to unlock your account.
                </p>
                <a
                  href={`mailto:${lockedInfo.adminEmail}`}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#2D5BFF] hover:underline"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {lockedInfo.adminEmail}
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                  label="Email Address"
                  placeholder="client@restaurant.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  {...register("email")}
                />

                <Input
                  label="Order ID"
                  placeholder="e.g. ORD-8942"
                  leftIcon={<KeyRound className="w-4 h-4" />}
                  helperText="Format: ORD-XXXX (case-insensitive)"
                  error={errors.orderId?.message}
                  {...register("orderId")}
                />

                {/* Attempts warning */}
                {attemptsLeft !== null && attemptsLeft > 0 && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      Incorrect Order ID.{" "}
                      <span className="font-bold">
                        {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""}{" "}
                        remaining
                      </span>{" "}
                      before your account is locked.
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full mt-2"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Access Dashboard
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};
