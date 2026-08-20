import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newOrderSchema, NewOrderFormData } from "@/lib/schema";
import { projectService } from "@/services/projectService";
import { useNotifications } from "@/context/NotificationContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { ArrowLeft, UploadCloud, Sparkles, Check, UserCheck, Loader2 } from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";

export const AdminNewOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [rawAssetFile, setRawAssetFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Client lookup state
  const [isExistingClient, setIsExistingClient] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NewOrderFormData>({
    resolver: zodResolver(newOrderSchema),
    defaultValues: {
      clientEmail: "",
      clientName: "",
      productName: "",
      productCategory: "AuRa AR Menu",
      description: "",
      notes: "",
    },
  });

  const clientEmail = watch("clientEmail");

  // Debounced email lookup
  const lookupClient = useCallback(
    async (email: string) => {
      // Basic email format check before making API call
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setIsExistingClient(false);
        setLookupDone(false);
        return;
      }

      setIsLookingUp(true);
      try {
        const result = await projectService.lookupClientByEmail(email);
        if (result.exists && result.clientName) {
          setValue("clientName", result.clientName);
          setIsExistingClient(true);
        } else {
          setValue("clientName", "");
          setIsExistingClient(false);
        }
        setLookupDone(true);
      } catch (err) {
        console.error("Client lookup failed:", err);
        setIsExistingClient(false);
        setLookupDone(true);
      } finally {
        setIsLookingUp(false);
      }
    },
    [setValue],
  );

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!clientEmail || clientEmail.trim() === "") {
      setIsExistingClient(false);
      setLookupDone(false);
      setIsLookingUp(false);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      lookupClient(clientEmail);
    }, 600);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [clientEmail, lookupClient]);

  const validateAndSetFile = (file: File | undefined | null) => {
    if (!file) {
      setRawAssetFile(null);
      return;
    }

    const extension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();

    if (extension !== ".glb" && extension !== ".usdz") {
      setFileError("Invalid format: Please upload a .glb or .usdz 3D file.");
      setRawAssetFile(null);
      addToast({
        type: "error",
        title: "Unsupported File Format",
        description: "Only raw .glb and .usdz files are supported.",
      });
      return;
    }

    setFileError(null);
    setRawAssetFile(file);
  };

  const onSubmit = async (data: NewOrderFormData) => {
    // For new clients, clientName is mandatory
    if (!isExistingClient && (!data.clientName || data.clientName.trim() === "")) {
      addToast({
        type: "error",
        title: "Client Name Required",
        description: "Please enter the client/company name for new clients.",
      });
      return;
    }

    // Require raw .glb or .usdz 3D asset file
    if (!rawAssetFile) {
      setFileError("Raw .glb or .usdz 3D asset file is required.");
      addToast({
        type: "error",
        title: "Raw 3D Asset Required",
        description:
          "Please upload a raw .glb or .usdz 3D model file to create this order.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const newProject = await projectService.createOrder({
        clientEmail: data.clientEmail,
        clientName: data.clientName,
        productName: data.productName,
        productCategory: data.productCategory,
        description: data.description,
        notes: data.notes,
        rawAssetFile: rawAssetFile,
      });

      addToast({
        type: "success",
        title: "Order Created Successfully",
        description: `Order ID ${newProject.orderId} created for ${newProject.clientEmail}.`,
      });

      navigate(`/admin/orders/${newProject.id}`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create order.";
      addToast({
        type: "error",
        title: "Order Creation Error",
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/orders">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Orders
            </Button>
          </Link>
        </div>

        <Card glass glow>
          <CardHeader>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-purple-500 mb-1">
              <Sparkles className="w-4 h-4 text-[#2D5BFF]" /> Admin Order
              Generation
            </div>
            <CardTitle className="text-2xl">Create New AR Order</CardTitle>
            <CardDescription>
              Register client scanning data, generate an Order ID, and initiate
              the 3D modeling pipeline.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="relative">
                  <Input
                    label="Client Email Address"
                    placeholder="client@gmail.com"
                    error={errors.clientEmail?.message}
                    {...register("clientEmail")}
                  />
                  {/* Lookup status indicator */}
                  {isLookingUp && (
                    <div className="absolute right-3 top-[2.15rem] flex items-center">
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--ink-soft)]" />
                    </div>
                  )}
                  {!isLookingUp && lookupDone && isExistingClient && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                      <UserCheck className="w-3.5 h-3.5" />
                      Existing Data found
                    </div>
                  )}
                  {!isLookingUp && lookupDone && !isExistingClient && clientEmail && (
                    <div className="mt-1.5 text-xs font-medium text-amber-500">
                      New client — please enter <b>Client / Company Name</b>
                    </div>
                  )}
                </div>

                <div>
                  <Input
                    label={
                      isExistingClient
                        ? "Client / Company Name (Auto-filled)"
                        : "Client / Company Name *"
                    }
                    placeholder="RvRanjan"
                    error={
                      errors.clientName?.message ||
                      (!isExistingClient && !isLookingUp && lookupDone
                        ? undefined
                        : undefined)
                    }
                    disabled={isExistingClient}
                    {...register("clientName")}
                    style={
                      isExistingClient
                        ? { opacity: 0.7, cursor: "not-allowed" }
                        : undefined
                    }
                  />
                  {isExistingClient && (
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">
                      Name loaded from existing records
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input
                  label="Product / Item Name"
                  placeholder="Pizza, Fries etc."
                  error={errors.productName?.message}
                  {...register("productName")}
                />

                <Select
                  label="Product Line / Category"
                  options={[
                    {
                      value: "AuRa AR Menu",
                      label: "AuRa AR Menu (Restaurant / Hospitality)",
                    },
                    {
                      value: "Teleport 3D Twin",
                      label: "Teleport 3D Twin (Real Estate / Spatial)",
                    },
                  ]}
                  error={errors.productCategory?.message}
                  {...register("productCategory")}
                />
              </div>

              <Textarea
                label="Product & Modeling Description"
                placeholder="Detail materials, dimensions, texture requirements, and lighting notes..."
                error={errors.description?.message}
                {...register("description")}
              />

              {/* File Upload Dropzone for Raw .glb/.usdz 3D Model Asset */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                  Raw 3D Asset Upload (.GLB / .USDZ) *
                </label>

                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all text-center ${
                    dragActive
                      ? "border-[#2D5BFF] bg-[#2D5BFF]/10"
                      : rawAssetFile
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : fileError
                          ? "border-red-500/50 bg-red-500/5"
                          : "border-[var(--contrast)] bg-[var(--surface-soft)] hover:border-[#2D5BFF]/50"
                  }`}
                >
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept=".glb,.usdz"
                  />

                  {rawAssetFile ? (
                    <div className="flex flex-col items-center gap-1 text-emerald-500 font-semibold text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        <span>Attached: {rawAssetFile.name}</span>
                      </div>
                      <span className="text-xs text-[var(--ink-soft)]">
                        ({(rawAssetFile.size / (1024 * 1024)).toFixed(2)} MB) • Click or drag to replace
                      </span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-[#2D5BFF] mb-2" />
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        Drag and drop raw 3D model (.glb / .usdz) or click to browse
                      </p>
                      <p className="text-xs text-[var(--ink-soft)] mt-1">
                        Mandatory raw asset file required for AR pipeline generation
                      </p>
                    </>
                  )}
                </div>
                {fileError && (
                  <p className="text-xs font-medium text-red-500 mt-1">
                    {fileError}
                  </p>
                )}
              </div>

              <Textarea
                label="Internal Admin Notes (Optional)"
                placeholder="Internal modeling instructions or priority flags..."
                {...register("notes")}
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--contrast)]">
                <Link to="/admin/orders">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                >
                  Generate Order & Start Pipeline
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};
