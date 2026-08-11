# Technical Architecture — Immverse Studios AR Client & Admin Portal

## 1. System Context & Architecture Overview

The Immverse Studios AR Client & Admin Portal is a standalone Single Page Application (SPA) built with **React 19**, **TypeScript**, **Vite 8**, **Tailwind CSS v4**, and **React Router v7**. 

It operates completely independently of the public marketing website, designed for deployment to **Netlify** via GitHub Actions.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React 19 Client SPA                             │
│                                                                        │
│  ┌──────────────────────┐   ┌───────────────────┐   ┌───────────────┐  │
│  │ Client / Admin Pages │   │ Component Library │   │ Auth Context  │  │
│  └──────────┬───────────┘   └─────────┬─────────┘   └───────┬───────┘  │
│             │                         │                     │          │
│             └─────────────────────────┼─────────────────────┘          │
│                                       ▼                                │
│                     ┌──────────────────────────────────┐               │
│                     │       Service Layer Abstraction  │               │
│                     │      (src/services/*.ts)         │               │
│                     └─────────────────┬────────────────┘               │
└───────────────────────────────────────┼────────────────────────────────┘
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             │                                                     │
             ▼ (VITE_USE_MOCK_API=true)                            ▼ (VITE_USE_MOCK_API=false)
┌───────────────────────────┐                        ┌──────────────────────────┐
│ Mock Service Adapter      │                        │ Production API Client    │
│ (src/services/mocks/*.ts) │                        │ (Native fetch wrapper)   │
└───────────────────────────┘                        └─────────────┬────────────┘
                                                                   │
                                                                   ▼
                                                     ┌──────────────────────────┐
                                                     │ Express / MongoDB API    │
                                                     │ (Production Backend)     │
                                                     └──────────────────────────┘
```

---

## 2. Directory & Directory Structure Blueprint

```
r:/Immverse/AR Project/
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # Automated CI lint/build & Netlify deployment workflow
├── public/
│   ├── favicon.ico
│   └── _redirects                # Netlify SPA fallback routing rule
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx        # Brand header, navigation bar, notifications bell, theme toggle, logout
│   │   │   ├── Footer.tsx        # Universal footer
│   │   │   ├── NotificationBell.tsx # Alerts dropdown
│   │   │   └── PageTransition.tsx# Framer motion page transition wrapper
│   │   └── ui/
│   │       ├── Badge.tsx         # Color-coded pipeline & subscription status badges
│   │       ├── Button.tsx        # Interactive button variants & loading states
│   │       ├── Card.tsx          # Surface cards with glow shadows
│   │       ├── Input.tsx         # Accessible text/select/file inputs
│   │       ├── Modal.tsx         # Accessible dialog backdrop
│   │       ├── Skeleton.tsx      # Loading skeleton placeholders
│   │       └── Toast.tsx         # Toast notification container
│   ├── context/
│   │   ├── AuthContext.tsx       # Auth state (JWT, role, user info, login/logout)
│   │   ├── NotificationContext.tsx # Toast & system alert state management
│   │   └── ThemeContext.tsx      # Dark/light CSS variable theme provider
│   ├── hooks/
│   │   ├── useAuth.ts            # Auth context shortcut
│   │   ├── useNotifications.ts # Notification context shortcut
│   │   └── useTheme.ts         # Theme context shortcut
│   ├── lib/
│   │   ├── constants.ts          # Pipeline stages, app defaults
│   │   ├── schema.ts             # Zod validation schemas for forms
│   │   └── utils.ts              # Date formatting, CSS class merge helpers
│   ├── pages/
│   │   ├── AdminClientDetailPage.tsx # Client detail & customer order table (/admin/clients/:email)
│   │   ├── AdminClientsPage.tsx  # Unique clients directory (/admin/clients)
│   │   ├── AdminDashboardPage.tsx# Admin stats overview (/admin)
│   │   ├── AdminNewOrderPage.tsx # Order creation form (/admin/orders/new)
│   │   ├── AdminOrderDetailPage.tsx # Order pipeline management & AR upload (/admin/orders/:id)
│   │   ├── AdminOrdersPage.tsx   # Order search & filter list (/admin/orders)
│   │   ├── AdminSubscriptionsPage.tsx # Client subscription manager (/admin/subscriptions)
│   │   ├── ClientDashboardPage.tsx# Client project list & self-service renewal (/dashboard)
│   │   ├── LoginPage.tsx         # Passwordless Email + Order ID login (/login)
│   │   ├── ProjectDetailPage.tsx # Client AR preview & QR code renderer (/dashboard/projects/:id)
│   │   └── UnauthorizedPage.tsx  # Role mismatch boundary page (/unauthorized)
│   ├── routes/
│   │   ├── AppRoutes.tsx         # React Router v7 routes configuration
│   │   └── ProtectedRoute.tsx    # JWT & role authorization shield
│   ├── services/
│   │   ├── api.ts                # Native fetch client with auth header injection
│   │   ├── authService.ts        # Auth login/logout API facade
│   │   ├── notificationService.ts# Alerts API facade
│   │   ├── projectService.ts     # Projects API facade
│   │   ├── subscriptionService.ts# Subscriptions API facade
│   │   └── mocks/
│   │       └── data.ts           # Mock datasets and async simulation wrappers
│   ├── styles/
│   │   └── index.css             # Tailwind v4 entry & CSS custom properties
│   ├── types/
│   │   └── index.ts              # Master TypeScript interface contracts
│   ├── App.tsx                   # App root provider wrapper
│   ├── main.tsx                  # React 19 entry point
│   └── vite-env.d.ts             # Vite environment typings
```

---

## 3. Data Contracts & TypeScript Interfaces

```ts
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
  renewalRequestedAt?: string;
}

export interface ClientSummary {
  clientEmail: string;
  clientName: string;
  totalOrders: number;
  subscription?: Subscription;
  latestProjectStatus?: ProjectStatus;
  latestProjectDate?: string;
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
```

---

## 4. Swappable Service Layer Design & Client Aggregation Strategy

All network requests flow through dedicated service modules (`authService`, `projectService`, `subscriptionService`, `notificationService`).

### Client-Side Order Aggregation
The client directory `/admin/clients` and client detail `/admin/clients/:email` group order records by `clientEmail`. In mock mode, projects are dynamically aggregated over `mockProjects`. When connected to the production Express/MongoDB API, this strategy mirrors a `GET /api/clients` or `GET /api/orders?clientEmail=:email` endpoint contract without requiring component rewrites.

---

## 5. Security & Authentication Flow

1. Client enters Email (`client@restaurant.com`) + Order ID (`ORD-8942`).
2. `authService.login()` validates combinations and returns a mock/real JWT token + User object.
3. Token and role are stored in `localStorage` under `immverse_auth_token` and `immverse_user`.
4. **Multi-Order Session Scoping**: The session is scoped to the authenticated **Email**. The client dashboard fetches and renders all orders associated with that email address.
5. `ProtectedRoute` verifies token presence and enforces role restrictions:
   - Client attempting to navigate to `/admin/*` is redirected to `/unauthorized`.
   - Unauthenticated users attempting to access protected routes are redirected to `/login`.
