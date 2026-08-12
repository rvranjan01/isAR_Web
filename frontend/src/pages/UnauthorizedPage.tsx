import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { PageTransition } from "@/components/layout/PageTransition";

export const UnauthorizedPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <PageTransition>
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center py-20 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 mb-6 border border-red-500/20">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h1 className="font-heading text-2xl font-bold text-[var(--ink)]">
          Access Restricted
        </h1>
        <p className="text-sm text-[var(--ink-soft)] mt-2 max-w-md">
          You do not have administrative permissions to view this resource.
          Logged in role:{" "}
          <span className="font-mono font-semibold uppercase">
            {user?.role || "Guest"}
          </span>
          .
        </p>

        <div className="mt-8 flex gap-4">
          <Link to={isAdmin ? "/admin" : "/dashboard"}>
            <Button
              variant="primary"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to {isAdmin ? "Admin Dashboard" : "My Projects"}
            </Button>
          </Link>
        </div>
      </div>
    </PageTransition>
  );
};
