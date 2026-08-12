import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { cn } from "@/lib/utils";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotifications();

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
  };

  const borders = {
    success: "border-emerald-500/30 bg-emerald-950/20",
    error: "border-red-500/30 bg-red-950/20",
    info: "border-blue-500/30 bg-blue-950/20",
    warning: "border-amber-500/30 bg-amber-950/20",
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border bg-[var(--surface)] shadow-lg backdrop-blur-md text-[var(--ink)]",
              borders[toast.type],
            )}
          >
            {icons[toast.type]}
            <div className="flex-1 text-sm">
              <h4 className="font-semibold text-xs uppercase tracking-wider">
                {toast.title}
              </h4>
              {toast.description && (
                <p className="text-[var(--ink-soft)] text-xs mt-0.5">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[var(--ink-soft)] hover:text-[var(--ink)] p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
