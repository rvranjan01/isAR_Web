import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  orderId: z.string().min(1, 'Order ID is required').toUpperCase(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const newOrderSchema = z.object({
  clientEmail: z.string().min(1, 'Client email is required').email('Invalid email address'),
  clientName: z.string().min(1, 'Client/Company name is required'),
  productName: z.string().min(1, 'Product name is required'),
  productCategory: z.enum(['AuRa AR Menu', 'Teleport 3D Twin'], {
    errorMap: () => ({ message: 'Please select a valid category' })
  }),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  notes: z.string().optional()
});

export type NewOrderFormData = z.infer<typeof newOrderSchema>;

export const updateSubscriptionSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
  renewalDate: z.string().min(1, 'Renewal date is required'),
  status: z.enum(['active', 'expired'])
});

export type UpdateSubscriptionFormData = z.infer<typeof updateSubscriptionSchema>;
