import React from "react";
import { ProjectStatus } from "@/types";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/constants";

interface BadgeProps {
  status: ProjectStatus;
  className?: string;
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  className,
  size = "md",
}) => {
  const statusStyles: Record<ProjectStatus, string> = {
    Uploaded:
      "bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    "Pending Review":
      "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
    "AR In Progress":
      "bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800/40",
    "Quality Check":
      "bg-purple-50 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800/40",
    Completed:
      "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40",
    Delivered:
      "bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800/40",
  };

  const dotStyles: Record<ProjectStatus, string> = {
    Uploaded: "bg-gray-400",
    "Pending Review": "bg-amber-500 animate-pulse",
    "AR In Progress": "bg-blue-500 animate-spin",
    "Quality Check": "bg-purple-500",
    Completed: "bg-emerald-500",
    Delivered: "bg-teal-500",
  };

  const config = STATUS_CONFIG[status] || { label: status };

  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-medium";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border shadow-2xs font-medium transition-colors",
        sizeClasses,
        statusStyles[status] || "bg-gray-100 text-gray-700 border-gray-200",
        className,
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0",
          dotStyles[status] || "bg-gray-400",
        )}
      />
      {config.label}
    </span>
  );
};
