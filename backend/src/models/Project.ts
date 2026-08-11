import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  orderId: string;
  clientEmail: string;
  clientName: string;
  productName: string;
  productCategory: "AuRa AR Menu" | "Teleport 3D Twin";
  description: string;
  status:
    | "Uploaded"
    | "Pending Review"
    | "AR In Progress"
    | "Quality Check"
    | "Completed"
    | "Delivered";
  productImageUrl: string;
  scanFileUrl?: string;
  arModelUrl?: string;
  arViewerUrl?: string;
  qrCodeUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

const ProjectSchema = new Schema<IProject>(
  {
    orderId: { type: String, required: true },
    clientEmail: { type: String, required: true, lowercase: true },
    clientName: { type: String, required: true },
    productName: { type: String, required: true },
    productCategory: {
      type: String,
      enum: ["AuRa AR Menu", "Teleport 3D Twin"],
      required: true,
    },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "Uploaded",
        "Pending Review",
        "AR In Progress",
        "Quality Check",
        "Completed",
        "Delivered",
      ],
      default: "Uploaded",
    },
    productImageUrl: { type: String, required: true },
    scanFileUrl: { type: String },
    arModelUrl: { type: String },
    arViewerUrl: { type: String },
    qrCodeUrl: { type: String },
    notes: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const Project = mongoose.model<IProject>("Project", ProjectSchema);
