import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  role: 'client' | 'admin';
  name?: string;
  companyName?: string;
  orderId?: string;
  loginAttempts: number;
  isLocked: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ['client', 'admin'],
      default: 'client',
    },
    name: {
      type: String,
    },
    companyName: {
      type: String,
    },
    orderId: {
      type: String,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);