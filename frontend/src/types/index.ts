export type Role = 'client' | 'admin';

export type ProjectStatus = 
  | 'Uploaded' 
  | 'Pending Review' 
  | 'AR In Progress' 
  | 'Quality Check' 
  | 'Completed' 
  | 'Delivered';

export interface User {
  id: string;
  email: string;
  role: Role;
  name?: string;
  companyName?: string;
  orderId?: string;
}

export interface Project {
  id: string;
  orderId: string;
  clientEmail: string;
  clientName: string;
  productName: string;
  productCategory: 'AuRa AR Menu' | 'Teleport 3D Twin';
  description: string;
  status: ProjectStatus;
  productImageUrl: string;
  scanFileUrl?: string;
  arModelUrl?: string;
  arViewerUrl?: string;
  qrCodeUrl?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Subscription {
  id: string;
  clientEmail: string;
  clientName: string;
  plan: 'monthly' | 'yearly';
  status: 'active' | 'expired' | 'renewal_requested';
  renewalDate: string;
  startDate: string;
  renewalRequestedAt?: string; // ISO timestamp set when client requests renewal
}

export interface Notification {
  id: string;
  recipientEmail: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}
