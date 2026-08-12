import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { projectService } from "@/services/projectService";
import { Project, ProjectStatus } from "@/types";
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
import { Select } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { PIPELINE_STAGES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Upload,
  CheckCircle,
  QrCode,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Box,
  Download,
} from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";

export const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToast } = useNotifications();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUploadingModel, setIsUploadingModel] = useState(false);
  const [isHandlingQRCode, setIsHandlingQRCode] = useState(false);
  const [selectedStatus, setSelectedStatus] =
    useState<ProjectStatus>("Uploaded");
  const [modelFileUrl, setModelFileUrl] = useState("");
  const [glbFile, setGlbFile] = useState<File | null>(null);
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await projectService.getProjectById(id);
        if (data) {
          setProject(data);
          setSelectedStatus(data.status);
        }
      } catch (err) {
        console.error("Failed to fetch project order detail:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    if (!project) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await projectService.updateProjectStatus(
        project.id,
        newStatus,
      );
      setProject(updated);
      setSelectedStatus(updated.status);
      addToast({
        type: "success",
        title: "Pipeline Status Updated",
        description: `Order ${project.orderId} status set to "${newStatus}".`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Status update failed";
      addToast({
        type: "error",
        title: "Update Error",
        description: msg,
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleModelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setIsUploadingModel(true);
    try {
      const updated = await projectService.uploadARModel(
        project.id,
        modelFileUrl || undefined,
        glbFile
      );
      setProject(updated);
      addToast({
        type: "success",
        title: "3D AR Model Uploaded",
        description: `Model linked successfully.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Model upload failed";
      addToast({
        type: "error",
        title: "Upload Error",
        description: msg,
      });
    } finally {
      setIsUploadingModel(false);
    }
  };

  const handleQRCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setIsHandlingQRCode(true);
    try {
      const updated = await projectService.handleQRCode(project.id, qrCodeFile);
      setProject(updated);
      addToast({
        type: "success",
        title: "QR Code Processed",
        description: qrCodeFile ? "Custom QR Code uploaded." : "Auto QR Code generated.",
      });
      setQrCodeFile(null); // Reset input
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "QR Code processing failed";
      addToast({
        type: "error",
        title: "Error",
        description: msg,
      });
    } finally {
      setIsHandlingQRCode(false);
    }
  };

  const copyViewerLink = () => {
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
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold font-heading">Order Not Found</h2>
        <Link to="/admin/orders">
          <Button
            variant="primary"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Orders List
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <Link to="/admin/orders">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Orders List
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono bg-[var(--surface-soft)] px-3 py-1 rounded-xl border border-[var(--contrast)]">
              Order ID:{" "}
              <strong className="text-[#2D5BFF]">{project.orderId}</strong>
            </span>
            <Badge status={project.status} />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Pipeline Control & Metadata */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Update Control */}
            <Card glass glow>
              <CardHeader>
                <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-purple-500 mb-1">
                  <Sparkles className="w-4 h-4 text-[#2D5BFF]" /> Admin Status
                  Stepper
                </div>
                <CardTitle className="text-xl">
                  Production Pipeline Stage
                </CardTitle>
                <CardDescription>
                  Update order status to notify client & trigger next phase
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <Select
                    label="Current Stage Selector"
                    value={selectedStatus}
                    onChange={(e) =>
                      setSelectedStatus(e.target.value as ProjectStatus)
                    }
                    options={PIPELINE_STAGES.map((stage) => ({
                      value: stage,
                      label: stage,
                    }))}
                  />

                  <Button
                    variant="primary"
                    onClick={() => handleStatusChange(selectedStatus)}
                    isLoading={isUpdatingStatus}
                    leftIcon={<CheckCircle className="w-4 h-4" />}
                  >
                    Set Status to {selectedStatus}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 3D Asset Upload UI */}
            <Card glass>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="w-5 h-5 text-[#2D5BFF]" /> Upload 3D Model (.GLB)
                </CardTitle>
                <CardDescription>
                  Upload the `.glb` file for the AR viewer.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleModelUpload} className="space-y-4">
                  {/* File Upload for .GLB */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                      3D Model File (.glb, .gltf, .usdz)
                    </label>
                    <input
                      type="file"
                      accept=".glb,.gltf,.usdz"
                      onChange={(e) => setGlbFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 bg-[var(--surface-soft)] text-[var(--ink)] border border-[var(--contrast)] rounded-xl text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#2D5BFF] file:text-white hover:file:bg-blue-600"
                    />
                    {glbFile && (
                      <p className="text-xs text-emerald-500 font-medium">
                        Selected file: {glbFile.name}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="secondary"
                    isLoading={isUploadingModel}
                    leftIcon={<Upload className="w-4 h-4 text-[#2D5BFF]" />}
                    disabled={!glbFile}
                  >
                    Upload GLB Asset
                  </Button>
                </form>

                {/* 3D Model Preview Viewport if arModelUrl exists */}
                {project?.arModelUrl && (
                  <div className="mt-6 pt-6 border-t border-[var(--contrast)] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)] flex items-center gap-1.5">
                        <Box className="w-4 h-4 text-[#2D5BFF]" /> Uploaded 3D
                        Model Preview (.GLB)
                      </h4>
                      <div className="flex items-center gap-2">
                        <a
                          href={project.arModelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[var(--surface-soft)] text-[var(--ink)] border border-[var(--contrast)] hover:border-[#2D5BFF]"
                        >
                          <ExternalLink className="w-3 h-3 text-[#2D5BFF]" />{" "}
                          Open .GLB
                        </a>
                        <a
                          href={project.arModelUrl}
                          download
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#2D5BFF] text-white hover:bg-blue-600"
                        >
                          <Download className="w-3 h-3" /> Download .GLB
                        </a>
                      </div>
                    </div>

                    <div className="relative w-full h-72 rounded-xl bg-black/5 dark:bg-black/40 overflow-hidden border border-[var(--contrast)] flex items-center justify-center">
                      <model-viewer
                        src={project.arModelUrl}
                        alt={project.productName}
                        auto-rotate
                        camera-controls
                        ar
                        shadow-intensity="1"
                        style={{ width: "100%", height: "100%" }}
                      ></model-viewer>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QR Code Upload UI */}
            <Card glass>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-[#2D5BFF]" /> QR Code Management
                </CardTitle>
                <CardDescription>
                  Upload a custom QR Code image or auto-generate one.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleQRCodeSubmit} className="space-y-4">
                  {/* File Upload for Custom QR Code */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                      Custom Product QR Code Image (.png, .jpg, .svg)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setQrCodeFile(e.target.files?.[0] || null)
                      }
                      className="w-full px-3 py-2 bg-[var(--surface-soft)] text-[var(--ink)] border border-[var(--contrast)] rounded-xl text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#2D5BFF] file:text-white hover:file:bg-blue-600"
                    />
                    {qrCodeFile && (
                      <p className="text-xs text-emerald-500 font-medium">
                        Selected file: {qrCodeFile.name}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      variant="secondary"
                      isLoading={isHandlingQRCode}
                      leftIcon={<Upload className="w-4 h-4 text-[#2D5BFF]" />}
                      disabled={!qrCodeFile && isHandlingQRCode}
                    >
                      {qrCodeFile ? "Upload Custom QR" : "Generate Auto QR Code"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Order Specs */}
            <Card glass>
              <CardHeader>
                <CardTitle className="text-lg">
                  Product Information & Client Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[var(--ink-soft)] block uppercase tracking-wider text-[10px]">
                      Client Name
                    </span>
                    <strong className="text-sm font-heading">
                      {project.clientName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[var(--ink-soft)] block uppercase tracking-wider text-[10px]">
                      Client Email
                    </span>
                    <strong className="text-sm font-mono">
                      {project.clientEmail}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[var(--ink-soft)] block uppercase tracking-wider text-[10px]">
                      Product Name
                    </span>
                    <strong className="text-sm">{project.productName}</strong>
                  </div>
                  <div>
                    <span className="text-[var(--ink-soft)] block uppercase tracking-wider text-[10px]">
                      Category
                    </span>
                    <strong className="text-sm">
                      {project.productCategory}
                    </strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--contrast)]">
                  <span className="text-[var(--ink-soft)] block uppercase tracking-wider text-[10px] mb-1">
                    Description
                  </span>
                  <p className="text-xs leading-relaxed text-[var(--ink-soft)]">
                    {project.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Col: Live Generated QR Code */}
          <div className="space-y-6">
            <Card glass glow className="text-center">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-center gap-2">
                  <QrCode className="w-5 h-5 text-[#2D5BFF]" /> Live Web AR
                  Viewer Preview
                </CardTitle>
                <CardDescription>
                  Generated Web AR viewer QR code for client scanning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.qrCodeUrl || project.arViewerUrl ? (
                  <div className="space-y-4">
                    <div className="inline-block p-4 rounded-2xl bg-white shadow-md border border-gray-200">
                      {project.qrCodeUrl ? (
                        <img
                          src={project.qrCodeUrl}
                          alt={`${project.productName} QR Code`}
                          className="w-[180px] h-[180px] object-contain"
                        />
                      ) : project.arViewerUrl ? (
                        <QRCodeSVG
                          value={project.arViewerUrl}
                          size={180}
                          level="H"
                          includeMargin={true}
                        />
                      ) : null}
                    </div>

                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-[var(--surface-soft)] border border-[var(--contrast)] text-xs text-[var(--ink-soft)] space-y-2">
                    <QrCode className="w-10 h-10 mx-auto text-[var(--ink-soft)] opacity-40" />
                    <p>
                      QR Code pending generation or upload.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card glass>
              <CardContent className="space-y-2 pt-6 text-xs text-[var(--ink-soft)]">
                <div className="flex justify-between py-1 border-b border-[var(--contrast)]">
                  <span>Created</span>
                  <strong className="text-[var(--ink)]">
                    {formatDate(project.createdAt)}
                  </strong>
                </div>
                <div className="flex justify-between py-1">
                  <span>Last Modified</span>
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
