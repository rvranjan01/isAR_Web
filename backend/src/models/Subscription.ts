import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  clientEmail: string;
  clientName: string;
  plan: "monthly" | "yearly";
  status: "active" | "expired" | "renewal_requested";
  renewalDate: Date;
  startDate: Date;
  renewalRequestedAt?: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    clientEmail: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    plan: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "renewal_requested"],
      required: true,
    },
    renewalDate: {
      type: Date,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    renewalRequestedAt: {
      type: Date,
    },
  },
  {
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id?.toString();

        // Format dates as expected by the frontend
        if (ret.renewalDate instanceof Date) {
          ret.renewalDate = ret.renewalDate.toISOString().split("T")[0];
        }

        if (ret.startDate instanceof Date) {
          ret.startDate = ret.startDate.toISOString().split("T")[0];
        }

        if (ret.renewalRequestedAt instanceof Date) {
          ret.renewalRequestedAt = ret.renewalRequestedAt.toISOString();
        }

        delete ret._id;
        delete ret.__v;

        return ret;
      },
    },
  },
);

export const Subscription = mongoose.model<ISubscription>(
  "Subscription",
  SubscriptionSchema,
);
