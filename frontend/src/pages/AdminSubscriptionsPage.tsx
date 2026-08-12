import React, { useEffect, useState } from "react";
import { subscriptionService } from "@/services/subscriptionService";
import { Subscription } from "@/types";
import { useNotifications } from "@/context/NotificationContext";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";
import {
  Users,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Edit3,
  Clock,
} from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";

type FilterStatus = "ALL" | "active" | "expired" | "renewal_requested";

export const AdminSubscriptionsPage: React.FC = () => {
  const { addToast } = useNotifications();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmingRenewalId, setConfirmingRenewalId] = useState<string | null>(
    null,
  );

  // Modal form states
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");
  const [status, setStatus] = useState<"active" | "expired">("active");
  const [renewalDate, setRenewalDate] = useState("");

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      const data = await subscriptionService.getSubscriptions();
      setSubscriptions(data);
    } catch (err) {
      console.error("Failed to fetch subscriptions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (sub: Subscription) => {
    setEditingSub(sub);
    setPlan(sub.plan);
    setStatus(sub.status === "renewal_requested" ? "active" : sub.status);
    setRenewalDate(sub.renewalDate);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    setIsUpdating(true);
    try {
      const updated = await subscriptionService.updateSubscription(
        editingSub.id,
        {
          plan,
          status,
          renewalDate,
        },
      );

      setSubscriptions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s)),
      );
      addToast({
        type: "success",
        title: "Subscription Updated",
        description: `Updated plan for ${updated.clientName}.`,
      });
      setEditingSub(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Subscription update failed";
      addToast({
        type: "error",
        title: "Update Error",
        description: msg,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Confirm a client's renewal request — extends date by plan interval, resets to active.
   * Admin is NOT prompted to change the plan type here; that is a separate deliberate action.
   */
  const handleConfirmRenewal = async (sub: Subscription) => {
    setConfirmingRenewalId(sub.id);
    try {
      const updated = await subscriptionService.confirmRenewal(sub.id);
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s)),
      );
      addToast({
        type: "success",
        title: "Renewal Confirmed",
        description: `${updated.clientName}'s subscription renewed until ${formatDate(updated.renewalDate)}.`,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not confirm renewal";
      addToast({ type: "error", title: "Renewal Error", description: msg });
    } finally {
      setConfirmingRenewalId(null);
    }
  };

  const renewalRequestedSubs = subscriptions.filter(
    (s) => s.status === "renewal_requested",
  );

  const filteredSubs = subscriptions.filter((s) => {
    if (filterStatus === "ALL") return true;
    return s.status === filterStatus;
  });

  const getStatusBadge = (sub: Subscription) => {
    if (sub.status === "active") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium capitalize inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
          <CheckCircle className="w-3 h-3" />
          active
        </span>
      );
    }
    if (sub.status === "renewal_requested") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium capitalize inline-flex items-center gap-1 bg-amber-500/15 text-amber-500 border border-amber-500/30">
          <Clock className="w-3 h-3" />
          Renewal Requested
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium capitalize inline-flex items-center gap-1 bg-red-500/15 text-red-500 border border-red-500/30">
        <AlertTriangle className="w-3 h-3" />
        expired
      </span>
    );
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--contrast)] pb-6">
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-500">
              Subscription Management
            </span>
            <h1 className="font-heading text-3xl font-extrabold text-[var(--ink)] mt-1">
              Client Subscription Plans
            </h1>
            <p className="text-sm text-[var(--ink-soft)] mt-1">
              View active client accounts, confirm renewal requests, and adjust
              plan tiers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSubscriptions}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* ── Renewal Requests Alert Section ── */}
        {renewalRequestedSubs.length > 0 && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/8 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-sm text-amber-600 dark:text-amber-300">
                  {renewalRequestedSubs.length} Renewal Request
                  {renewalRequestedSubs.length > 1 ? "s" : ""} Awaiting
                  Confirmation
                </h2>
                <p className="text-xs text-amber-600/70 dark:text-amber-300/70">
                  These clients have requested renewal. Confirm to extend their
                  plan by the existing interval.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {renewalRequestedSubs.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-4 bg-[var(--surface)] rounded-xl border border-amber-500/30 px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-semibold text-sm text-[var(--ink)] font-heading">
                        {sub.clientName}
                      </div>
                      <div className="text-xs font-mono text-[var(--ink-soft)]">
                        {sub.clientEmail}
                      </div>
                    </div>
                    <div className="hidden sm:block text-xs text-[var(--ink-soft)]">
                      <span className="capitalize font-medium text-[#2D5BFF]">
                        {sub.plan} Plan
                      </span>
                      {sub.renewalRequestedAt && (
                        <span className="ml-2 opacity-70">
                          Requested {formatDate(sub.renewalRequestedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleConfirmRenewal(sub)}
                    isLoading={confirmingRenewalId === sub.id}
                    leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                  >
                    Confirm Renewal
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[var(--surface-soft)] rounded-xl border border-[var(--contrast)] w-fit flex-wrap">
          {(
            [
              { value: "ALL", label: `All Clients (${subscriptions.length})` },
              {
                value: "active",
                label: `Active (${subscriptions.filter((s) => s.status === "active").length})`,
              },
              {
                value: "renewal_requested",
                label: `Renewal Requested (${renewalRequestedSubs.length})`,
              },
              {
                value: "expired",
                label: `Expired (${subscriptions.filter((s) => s.status === "expired").length})`,
              },
            ] as { value: FilterStatus; label: string }[]
          ).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterStatus(tab.value)}
              className={`px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                filterStatus === tab.value
                  ? "bg-[var(--surface)] text-[var(--ink)] font-semibold shadow-xs"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
              } ${tab.value === "renewal_requested" && renewalRequestedSubs.length > 0 ? "text-amber-500" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Subscriptions Table */}
        <Card glass>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredSubs.length === 0 ? (
              <div className="p-12 text-center text-[var(--ink-soft)]">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <h3 className="text-base font-semibold font-heading text-[var(--ink)]">
                  No Subscriptions Found
                </h3>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-soft)] border-b border-[var(--contrast)] text-[var(--ink-soft)] font-mono uppercase">
                    <tr>
                      <th className="px-6 py-3.5">Client Company</th>
                      <th className="px-6 py-3.5">Email</th>
                      <th className="px-6 py-3.5">Plan Tier</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Renewal Date</th>
                      <th className="px-6 py-3.5">Start Date</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--contrast)]">
                    {filteredSubs.map((sub) => (
                      <tr
                        key={sub.id}
                        className={`hover:bg-[var(--surface-soft)] transition-colors ${
                          sub.status === "renewal_requested"
                            ? "bg-amber-500/5"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4 font-bold text-[var(--ink)] font-heading">
                          {sub.clientName}
                        </td>
                        <td className="px-6 py-4 font-mono text-[var(--ink-soft)]">
                          {sub.clientEmail}
                        </td>
                        <td className="px-6 py-4 capitalize font-semibold text-[#2D5BFF]">
                          {sub.plan} Plan
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(sub)}</td>
                        <td className="px-6 py-4 font-mono text-[var(--ink)]">
                          {formatDate(sub.renewalDate)}
                        </td>
                        <td className="px-6 py-4 text-[var(--ink-soft)]">
                          {formatDate(sub.startDate)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {sub.status === "renewal_requested" && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleConfirmRenewal(sub)}
                                isLoading={confirmingRenewalId === sub.id}
                                leftIcon={
                                  <CheckCircle className="w-3.5 h-3.5" />
                                }
                              >
                                Confirm
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(sub)}
                              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                            >
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Renewal Edit Modal */}
        <Modal
          isOpen={!!editingSub}
          onClose={() => setEditingSub(null)}
          title={`Edit Subscription: ${editingSub?.clientName}`}
          description={`Update renewal date or plan status for ${editingSub?.clientEmail}`}
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            <Select
              label="Plan Tier"
              value={plan}
              onChange={(e) => setPlan(e.target.value as "monthly" | "yearly")}
              options={[
                { value: "yearly", label: "Yearly Plan" },
                { value: "monthly", label: "Monthly Plan" },
              ]}
            />

            <Select
              label="Subscription Status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "active" | "expired")
              }
              options={[
                { value: "active", label: "Active (AR QR Enabled)" },
                { value: "expired", label: "Expired (AR QR Disabled)" },
              ]}
            />

            <Input
              label="Renewal Expiration Date"
              type="date"
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--contrast)]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingSub(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isUpdating}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
};
