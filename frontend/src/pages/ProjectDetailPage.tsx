import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { projectService } from "@/services/projectService";
import { subscriptionService } from "@/services/subscriptionService";
import { Project, Subscription } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { PIPELINE_STAGES, STATUS_CONFIG } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  QrCode,
  Smartphone,
  Copy,
  Check,
  AlertTriangle,
  Layers,
  Sparkles,
  Info,
  Box,
  Download,
  ExternalLink,
} from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const [project, setProject] = useState<Project | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const proj = await projectService.getProjectById(id);
        setProject(proj);

        if (user?.email) {
          const sub = await subscriptionService.getSubscriptionByEmail(
            user.email,
          );
          setSubscription(sub);
        }
      } catch (err) {
        console.error("Failed to load project details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  const isExpired = subscription?.status === "expired";

  const copyViewerUrl = () => {
    if (!project?.arViewerUrl) return;
    navigator.clipboard.writeText(project.arViewerUrl);
    setIsCopied(true);
    addToast({
      type: "success",
      title: "AR Link Copied",
      description: "Web AR URL copied to clipboard.",
    });
    setTimeout(() => setIsCopied(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96 w-full lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold font-heading">Project Not Found</h2>
        <p className="text-sm text-[var(--ink-soft)]">
          The requested project record could not be found or you do not have
          permission to view it.
        </p>
        <Link to="/dashboard">
          <Button
            variant="primary"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const currentStageIndex = PIPELINE_STAGES.indexOf(project.status);

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation header */}
        <div className="flex items-center justify-between">
          <Link to="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to My Projects
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--ink-soft)]">
              ID: {project.orderId}
            </span>
            <Badge status={project.status} />
          </div>
        </div>

        {/* Top Overview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Image & Details & 3D Viewer */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interactive 3D Model Viewer Card (if arModelUrl is present) */}
            <CardContent className="space-y-4 pt-6">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-[#2D5BFF] mb-1">
                  {project.clientName}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[var(--ink)]">
                  {project.productName}
                </h1>
              </div>

              <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
                {project.description}
              </p>

              {project.notes && (
                <div className="p-4 rounded-xl bg-[var(--surface-soft)] border border-[var(--contrast)] text-xs text-[var(--ink-soft)] flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-[#2D5BFF] shrink-0 mt-0.5" />

                  <div>
                    <strong className="text-[var(--ink)] block mb-0.5">
                      3D Engineering Note:
                    </strong>
                    {project.notes}
                  </div>
                </div>
              )}

              {/* Interactive 3D Model Viewer */}
              {project.arModelUrl && (
                <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--contrast)] bg-[var(--surface-soft)]">
                  {/* Viewer Header */}
                  <div className="px-4 py-3 border-b border-[var(--contrast)] flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--ink)]">
                        3D AR Model Preview
                      </h3>

                      <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                        Interactive 3D model
                      </p>
                    </div>

                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#2D5BFF]/10 text-[#2D5BFF]">
                      AR Ready
                    </span>
                  </div>

                  {/* 3D Model */}
                  <div className="w-full h-[400px] bg-[var(--surface-soft)]">
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
                  </div>

                  {/* Viewer Instructions */}
                  <div className="px-4 py-3 border-t border-[var(--contrast)]">
                    <p className="text-xs text-[var(--ink-soft)] text-center">
                      Click and drag to rotate • Scroll to zoom
                    </p>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Pipeline Stage Stepper */}
            <Card glass>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="w-4 h-4 text-[#2D5BFF]" /> Production
                  Status Tracker
                </CardTitle>
                <CardDescription>
                  Current stage:{" "}
                  <strong className="text-[var(--ink)]">
                    {project.status}
                  </strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative py-4">
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    {PIPELINE_STAGES.map((stage, idx) => {
                      const isPast = idx < currentStageIndex;
                      const isCurrent = idx === currentStageIndex;

                      return (
                        <div
                          key={stage}
                          className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
                            isCurrent
                              ? "border-[#2D5BFF] bg-[#2D5BFF]/10 text-[var(--ink)] font-semibold shadow-xs"
                              : isPast
                                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                                : "border-[var(--contrast)] bg-[var(--surface-soft)] text-[var(--ink-soft)] opacity-60"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono mb-2 ${
                              isCurrent
                                ? "bg-[#2D5BFF] text-white shadow-glow"
                                : isPast
                                  ? "bg-emerald-500 text-white"
                                  : "bg-[var(--contrast)] text-[var(--ink-soft)]"
                            }`}
                          >
                            {isPast ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              idx + 1
                            )}
                          </div>
                          <span className="text-[11px] font-medium leading-tight">
                            {stage}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Col: Web AR QR Code Box */}
          <div className="space-y-6">
            <Card glass glow className="overflow-hidden">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg flex items-center justify-center gap-2">
                  <QrCode className="w-5 h-5 text-[#2D5BFF]" /> Web AR Viewer QR
                  Code
                </CardTitle>
                <CardDescription>
                  Scan with your smartphone camera to launch the interactive AR
                  model.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 text-center">
                {isExpired ? (
                  /* Lockout state if client subscription is expired */
                  <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 space-y-3">
                    <AlertTriangle className="w-10 h-10 text-red-500 mx-auto animate-bounce" />
                    <h4 className="font-bold text-base font-heading">
                      AR Access Deactivated
                    </h4>
                    <p className="text-xs leading-relaxed opacity-90">
                      Your client subscription has expired. Web AR QR scanning
                      is temporarily locked. Contact Immverse Studios to
                      reactivate access.
                    </p>
                    <a
                      href="mailto:support@immversestudios.com?subject=Renew%20Subscription"
                      className="inline-block px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 transition-colors"
                    >
                      Renew Subscription
                    </a>
                  </div>
                ) : project.status !== "Completed" &&
                  project.status !== "Delivered" ? (
                  /* Pending completion state */
                  <div className="p-8 rounded-2xl bg-[var(--surface-soft)] border border-[var(--contrast)] text-[var(--ink-soft)] space-y-3">
                    <Smartphone className="w-12 h-12 text-[#2D5BFF] mx-auto animate-pulse" />
                    <h4 className="font-semibold text-sm text-[var(--ink)]">
                      AR Model in Production
                    </h4>
                    <p className="text-xs">
                      {STATUS_CONFIG[project.status]?.description ||
                        "3D assets are being processed."}
                    </p>
                    <div className="text-[10px] font-mono bg-[#2D5BFF]/10 text-[#2D5BFF] py-1 px-3 rounded-full inline-block">
                      QR Code will auto-appear when status = Completed
                    </div>
                  </div>
                ) : (
                  /* Ready state: Render Custom QR Code Image or SVG */
                  <div className="space-y-4">
                    <div className="inline-block p-4 rounded-2xl bg-white shadow-lg border border-gray-200">
                      {project.qrCodeUrl ? (
                        <img
                          src={project.qrCodeUrl}
                          alt={`${project.productName} QR Code`}
                          className="w-48 h-48 object-contain"
                        />
                      ) : (
                        <QRCodeSVG
                          value={
                            project.arViewerUrl ||
                            `https://ar.immversestudios.com/view/${project.id}`
                          }
                          size={200}
                          level="H"
                          includeMargin={true}
                        />
                      )}
                    </div>

                    <p className="text-xs text-[var(--ink-soft)] px-2">
                      Scan on iOS Safari or Android Chrome for instant WebXR /
                      QuickLook AR.
                    </p>

                    {/* <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={copyViewerUrl}
                      leftIcon={
                        isCopied ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )
                      }
                    >
                      {isCopied ? "Link Copied!" : "Copy Web AR Link"}
                    </Button> */}
                  </div>
                )}

                {/* Important notice: No GLB download */}
                <div className="p-3 rounded-xl bg-[var(--surface-soft)] border border-[var(--contrast)] text-[10px] text-[var(--ink-soft)] text-left flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#2D5BFF] shrink-0 mt-0.5" />
                  <span>
                    <strong>Note:</strong> Immverse Web AR experiences launch
                    directly in browser via QR scan. Raw 3D files are protected
                    and managed directly by the platform.
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Metadata Card */}
            <Card glass>
              <CardContent className="space-y-3 pt-6 text-xs text-[var(--ink-soft)]">
                <div className="flex justify-between py-1 border-b border-[var(--contrast)]">
                  <span>Order Number</span>
                  <strong className="font-mono text-[var(--ink)]">
                    {project.orderId}
                  </strong>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--contrast)]">
                  <span>Category</span>
                  <strong className="text-[var(--ink)]">
                    {project.productCategory}
                  </strong>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--contrast)]">
                  <span>Created Date</span>
                  <strong className="text-[var(--ink)]">
                    {formatDate(project.createdAt)}
                  </strong>
                </div>
                <div className="flex justify-between py-1">
                  <span>Last Update</span>
                  <strong className="text-[var(--ink)]">
                    {formatDate(project.updatedAt)}
                  </strong>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
