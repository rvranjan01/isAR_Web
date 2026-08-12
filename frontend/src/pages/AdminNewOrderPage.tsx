import React, { useState } from "react";
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
import { ArrowLeft, UploadCloud, Sparkles, Check } from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";

export const AdminNewOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
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

  const onSubmit = async (data: NewOrderFormData) => {
    setIsSubmitting(true);
    try {
      const newProject = await projectService.createOrder({
        clientEmail: data.clientEmail,
        clientName: data.clientName,
        productName: data.productName,
        productCategory: data.productCategory,
        description: data.description,
        notes: data.notes,
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
      setUploadedFileName(e.dataTransfer.files[0].name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFileName(e.target.files[0].name);
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
                <Input
                  label="Client Email Address"
                  placeholder="client@restaurant.com"
                  error={errors.clientEmail?.message}
                  {...register("clientEmail")}
                />

                <Input
                  label="Client / Company Name"
                  placeholder="Bistro Lumière"
                  error={errors.clientName?.message}
                  {...register("clientName")}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input
                  label="Product / Item Name"
                  placeholder="Signature Wagyu Steak"
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

              {/* File Upload Dropzone for Raw Scan Data */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                  Raw Scan Data & Asset Upload (OBJ / PLY / ZIP)
                </label>

                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all text-center ${
                    dragActive
                      ? "border-[#2D5BFF] bg-[#2D5BFF]/10"
                      : uploadedFileName
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : "border-[var(--contrast)] bg-[var(--surface-soft)] hover:border-[#2D5BFF]/50"
                  }`}
                >
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept=".zip,.obj,.ply,.png,.jpg,.jpeg,.glb"
                  />

                  {uploadedFileName ? (
                    <div className="flex items-center gap-2 text-emerald-500 font-semibold text-sm">
                      <Check className="w-5 h-5" />
                      <span>Uploaded: {uploadedFileName}</span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-[#2D5BFF] mb-2" />
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        Drag and drop raw scan ZIP or click to browse
                      </p>
                      <p className="text-xs text-[var(--ink-soft)] mt-1">
                        Supports photogrammetry ZIPs, .OBJ, .PLY, or raw photo
                        sets (max 500MB)
                      </p>
                    </>
                  )}
                </div>
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
