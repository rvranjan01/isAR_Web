import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  recipientEmail: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: Date;
  link?: string;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientEmail: { type: String, required: true, lowercase: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      required: true,
    },
    read: { type: Boolean, default: false },
    link: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

export const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema,
);
