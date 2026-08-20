import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { projectService } from "@/services/projectService";
import { subscriptionService } from "@/services/subscriptionService";
import { notificationService } from "@/services/notificationService";
import { useNotifications } from "@/context/NotificationContext";
import { Project, Subscription } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { calculateDaysRemaining, formatDate } from "@/lib/utils";
import {
  Box,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  ArrowRight,
  Layers,
  RefreshCw,
  Info,
} from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";

export const ClientDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const [projects, setProjects] = useState<Project[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "all" | "in_progress" | "completed"
  >("all");
  const [isRequestingRenewal, setIsRequestingRenewal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email) return;
      setIsLoading(true);
      try {
        // Fetches ALL projects for the authenticated email (not just the login order ID)
        const [projData, subData] = await Promise.all([
          projectService.getProjects(user.email),
          subscriptionService.getSubscriptionByEmail(user.email),
        ]);
        setProjects(projData);
        setSubscription(subData);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const daysRemaining = subscription
    ? calculateDaysRemaining(subscription.renewalDate)
    : 0;
  const isExpiringSoon =
    subscription?.status === "active" &&
    daysRemaining <= 3 &&
    daysRemaining >= 0;
  const isExpired =
    subscription?.status === "expired" ||
    (subscription?.status === "active" && daysRemaining < 0);
  const isRenewalRequested = subscription?.status === "renewal_requested";

  const handleRequestRenewal = async () => {
    if (!user?.email || !subscription) return;
    setIsRequestingRenewal(true);
    try {
      const updated = await subscriptionService.requestRenewal(user.email);
      setSubscription(updated);

      // Trigger admin notification
      await notificationService.addNotification({
        recipientEmail: "admin@immversestudios.com",
        title: "Renewal Request Received",
        message: `${subscription.clientName} (${user.email}) has requested subscription renewal. Review and confirm in the Subscriptions panel.`,
        type: "warning",
        link: "/admin/subscriptions",
      });

      addToast({
        type: "success",
        title: "Renewal Requested!",
        description:
          "Your renewal request has been sent. Our team will confirm it shortly.",
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not send renewal request.";
      addToast({ type: "error", title: "Request Failed", description: msg });
    } finally {
      setIsRequestingRenewal(false);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.productCategory
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === "completed") {
        return project.status === "Completed" || project.status === "Delivered";
      }
      if (activeTab === "in_progress") {
        return project.status !== "Completed" && project.status !== "Delivered";
      }
      return true;
    });
  }, [projects, searchQuery, activeTab]);

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--contrast)] pb-6">
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#2D5BFF]">
              Client Experience Portal
            </span>
            <h1 className="font-heading text-3xl font-extrabold text-[var(--ink)] mt-1">
              Welcome back, {user?.name || user?.email}
            </h1>
            <p className="text-sm text-[var(--ink-soft)] mt-1">
              Track 3D modeling progress and access your web AR QR code assets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono bg-[var(--surface-soft)] px-3 py-1.5 rounded-xl border border-[var(--contrast)] text-[var(--ink-soft)]">
              Session Email:{" "}
              <strong className="text-[var(--ink)]">{user?.email}</strong>
            </span>
          </div>
        </div>

        {/* === Subscription Alert Banners === */}

        {/* Renewal Requested — soften urgency, show pending state */}
        {isRenewalRequested && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-amber-600 dark:text-amber-300 shadow-sm">
            <div className="flex items-center gap-3">
              <Info className="h-6 w-6 shrink-0 text-amber-400" />
              <div>
                <h4 className="font-semibold text-sm font-heading">
                  Renewal Request Pending
                </h4>
                <p className="text-xs opacity-90">
                  Your renewal request is awaiting confirmation from Immverse
                  Studios. We'll activate your plan shortly — no action needed.
                </p>
              </div>
            </div>
            <span className="shrink-0 px-4 py-2 bg-amber-400/20 text-amber-600 dark:text-amber-300 border border-amber-400/40 rounded-xl text-xs font-semibold">
              Pending Confirmation
            </span>
          </div>
        )}

        {/* Expiring soon — only if no renewal requested */}
        {isExpiringSoon && !isRenewalRequested && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-300 shadow-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 shrink-0 text-amber-500 animate-pulse" />
              <div>
                <h4 className="font-semibold text-sm font-heading">
                  Subscription Renewal Due Soon
                </h4>
                <p className="text-xs opacity-90">
                  Your AuRa/Teleport AR access plan expires in{" "}
                  <strong>
                    {daysRemaining} day{daysRemaining === 1 ? "" : "s"}
                  </strong>{" "}
                  ({formatDate(subscription?.renewalDate || "")}). Request
                  renewal below.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRequestRenewal}
              isLoading={isRequestingRenewal}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Renew Subscription
            </Button>
          </div>
        )}

        {/* Expired */}
        {isExpired && !isRenewalRequested && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-600 dark:text-red-300 shadow-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 shrink-0 text-red-500" />
              <div>
                <h4 className="font-semibold text-sm font-heading">
                  Subscription Expired — AR Access Deactivated
                </h4>
                <p className="text-xs opacity-90">
                  Your AR QR code access is currently inactive. Request renewal
                  to reactivate live 3D web AR models.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRequestRenewal}
              isLoading={isRequestingRenewal}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Request Renewal
            </Button>
          </div>
        )}

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card glass>
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-0">
              <span className="text-xs font-semibold uppercase text-[var(--ink-soft)]">
                Total AR Projects
              </span>
              <Layers className="w-5 h-5 text-[#2D5BFF]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold font-heading">
                {isLoading ? (
                  <Skeleton className="h-9 w-12" />
                ) : (
                  projects.length
                )}
              </div>
              <p className="text-xs text-[var(--ink-soft)] mt-1">
                AuRa AR Menus &amp; Teleport 3D Twins
              </p>
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-0">
              <span className="text-xs font-semibold uppercase text-[var(--ink-soft)]">
                Active Models
              </span>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold font-heading text-emerald-500">
                {isLoading ? (
                  <Skeleton className="h-9 w-12" />
                ) : (
                  projects.filter(
                    (p) => p.status === "Completed" || p.status === "Delivered",
                  ).length
                )}
              </div>
              <p className="text-xs text-[var(--ink-soft)] mt-1">
                Ready for QR scanning &amp; placement
              </p>
            </CardContent>
          </Card>

          {/* Subscription Status Card with Renew button */}
          <Card glass>
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-0">
              <span className="text-xs font-semibold uppercase text-[var(--ink-soft)]">
                Subscription Status
              </span>
              <Calendar className="w-5 h-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-9 w-24" />
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isRenewalRequested ? (
                      <span className="text-sm font-bold font-heading text-amber-500">
                        Renewal Pending
                      </span>
                    ) : (
                      <span
                        className={`text-lg font-bold font-heading capitalize ${isExpired ? "text-red-500" : "text-emerald-500"}`}
                      >
                        {subscription?.status || "Active"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--ink-soft)]">
                    Renewal Date: {formatDate(subscription?.renewalDate || "")}
                  </p>

                  {/* Self-service Renew button — only show when active or expired and not already requested */}
                  {!isRenewalRequested &&
                    (subscription?.status === "active" || isExpired) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRequestRenewal}
                        isLoading={isRequestingRenewal}
                        leftIcon={<RefreshCw className="w-3 h-3" />}
                        className="mt-1 text-xs"
                      >
                        {isExpired ? "Request Renewal" : "Renew Subscription"}
                      </Button>
                    )}

                  {/* Non-interactive state when renewal is pending */}
                  {isRenewalRequested && (
                    <p className="text-xs text-amber-500 font-medium flex items-center gap-1 mt-1">
                      <Info className="w-3 h-3" />
                      Renewal requested — awaiting confirmation
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Projects Control Bar: Tabs & Search */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[var(--surface-soft)] rounded-xl border border-[var(--contrast)]">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === "all"
                    ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs font-semibold"
                    : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                My Projects ({projects.length})
              </button>
              <button
                onClick={() => setActiveTab("in_progress")}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === "in_progress"
                    ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs font-semibold"
                    : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                In Production (
                {
                  projects.filter(
                    (p) => p.status !== "Completed" && p.status !== "Delivered",
                  ).length
                }
                )
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === "completed"
                    ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs font-semibold"
                    : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                Completed &amp; Live (
                {
                  projects.filter(
                    (p) => p.status === "Completed" || p.status === "Delivered",
                  ).length
                }
                )
              </button>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search projects, order IDs..."
                leftIcon={<Search className="w-4 h-4" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="p-4 space-y-3">
                  <Skeleton className="h-48 w-full rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </Card>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <Card className="p-12 text-center">
              <Box className="w-12 h-12 text-[var(--ink-soft)] mx-auto mb-3 opacity-40" />
              <h3 className="text-lg font-semibold font-heading text-[var(--ink)]">
                No Projects Found
              </h3>
              <p className="text-xs text-[var(--ink-soft)] mt-1 max-w-sm mx-auto">
                No orders match your current filter or search criteria.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/dashboard/projects/${project.id}`}
                  className="group"
                >
                  <Card
                    glass
                    className="h-full overflow-hidden transition-all duration-200 group-hover:border-[#2D5BFF]/50 group-hover:shadow-glow"
                  >
                    <div className="relative h-48 w-full bg-[var(--surface-soft)] overflow-hidden">
                      {project.arModelUrl ? (
                        <model-viewer
                          src={project.arModelUrl}
                          alt={project.productName}
                          auto-rotate
                          camera-controls
                          ar
                          shadow-intensity="1"
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                        />
                      ) : project.rawAssetUrl || project.scanFileUrl ? (
                        <model-viewer
                          src={project.rawAssetUrl || project.scanFileUrl}
                          alt={project.productName}
                          auto-rotate
                          camera-controls
                          ar
                          shadow-intensity="1"
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                        />
                      ) : project.productImageUrl ? (
                        <img
                          src={project.productImageUrl}
                          alt={project.productName}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[var(--ink-soft)] bg-black/5 dark:bg-black/30">
                          <Box className="w-8 h-8 opacity-40 mb-1" />
                          <span className="text-xs">Raw Asset Attached</span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <Badge status={project.status} />
                      </div>
                      <div className="absolute top-3 left-3">
                        {project.arModelUrl ? (
                          <span className="bg-emerald-500/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-semibold font-mono text-white">
                            3D Model
                          </span>
                        ) : project.rawAssetUrl || project.scanFileUrl ? (
                          <span className="bg-[#2D5BFF]/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-semibold font-mono text-white">
                            Raw Asset (.GLB/.USDZ)
                          </span>
                        ) : null}
                      </div>
                      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-white">
                        {project.productCategory}
                      </div>
                    </div>

                    <CardContent className="space-y-3">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-soft)]">
                          {project.orderId}
                        </div>
                        <CardTitle className="group-hover:text-[#2D5BFF] transition-colors mt-0.5 line-clamp-1">
                          {project.productName}
                        </CardTitle>
                      </div>

                      <p className="text-xs text-[var(--ink-soft)] line-clamp-2">
                        {project.description}
                      </p>

                      <div className="pt-2 border-t border-[var(--contrast)] flex items-center justify-between text-xs text-[var(--ink-soft)]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[var(--ink-soft)]" />
                          {formatDate(project.createdAt)}
                        </span>

                        <span className="flex items-center gap-1 font-semibold text-[#2D5BFF] group-hover:translate-x-1 transition-transform">
                          {project.status === "Completed"
                            ? "View QR Code"
                            : "Track Status"}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};
