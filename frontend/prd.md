# Product Requirements Document (PRD) — Immverse Studios AR Client & Admin Portal

## 1. Product Overview & Purpose
Immverse Studios builds augmented reality (AR) and 3D experiences under two main product lines:
- **Teleport**: 3D digital twins & 360° virtual walkthroughs for real estate, spaces, and industrial products.
- **AuRa**: Interactive 3D/AR menu and showcase experiences for restaurants, cafes, and hospitality venues.

This **Client + Admin Web Portal** (`portal.immversestudios.com`) serves as the central hub where:
1. **Clients** (AuRa / Teleport customers) log in via passwordless authentication (Email + Order ID) to view their AR project status, active subscription details, request subscription renewals, and launch web AR experiences via dynamically generated QR codes.
2. **Internal Admins** (Immverse Studios staff) manage incoming client orders, update production pipeline stages, upload final 3D AR models (`.glb`, `.gltf`, `.usdz`), confirm client subscription renewal requests, and view consolidated client account histories.

---

## 2. Target Audience & User Personas

### Persona A: Restaurant Owner / Enterprise Client ("Client")
- **Needs**: Quick visibility into all their AR orders under one email, self-service subscription renewal requests, instant access to scannable AR QR codes for physical placement, and tracking of renewal dates.
- **Key Pain Points**: Unnecessary password friction, lack of status transparency during 3D modeling, complicated asset deployment.
- **Auth Model**: Passwordless login using **Client Email** + **Order ID**.

### Persona B: Immverse Operations & AR Team ("Admin")
- **Needs**: Centralized dashboard to track orders across pipeline stages, dedicated Client Directory view (`/admin/clients`) aggregating all orders by customer email, tool to upload final 3D files (`.glb`/`.gltf`/`.usdz`), and workflow to confirm client renewal requests.
- **Key Pain Points**: Manual email updates, decentralized file tracking, uncoordinated status communication.
- **Auth Model**: Email + Order ID mapped to administrative role (`role: "admin"`).

---

## 3. End-to-End AR Product Workflow

```
[1. Client Demo Request (Marketing Site)] 
                   │ (Offline)
                   ▼
[2. Requirements & 3D Scanning (Offline)] 
                   │
                   ▼
[3. Admin Creates Order in Portal] ──► Status: "Uploaded" / "Pending Review"
                   │
                   ▼
[4. AR Modeling & Quality Check] ──► Status: "AR In Progress" ──► "Quality Check"
                   │
                   ▼
[5. Admin Uploads .glb / .usdz Model] ──► Status: "Completed" (QR Auto-Generated)
                   │
                   ▼
[6. Client Logs into Portal] ──► Views All Email Orders & Scans QR Code for Web AR
                   │
                   ▼
[7. Client Requests Renewal] ──► Status: "renewal_requested" ──► Admin Confirms Renewal
```

---

## 4. Detailed Feature Specifications

### 4.1 Authentication & Authorization
- **Route**: `/login`
- **Fields**: Email Address (validated format), Order ID (e.g. `ORD-8942`).
- **Behavior**:
  - Validates credentials against `authService.login()`.
  - On success, stores JWT token and user profile in `AuthContext` + `localStorage`.
  - **Multi-Order Session Scoping**: Session is scoped to the **Email**. Logging in with any valid Email + Order ID pair authenticates the client for **all** projects associated with that email address.
  - Redirects clients to `/dashboard` and admins to `/admin`.
  - Header logo links back to the main marketing website (`immversestudios.com`).

### 4.2 Client Dashboard & Project Detail
- **Route**: `/dashboard`
  - List of **all** projects/orders tied to the logged-in email.
  - Active subscription card (Plan tier: Monthly/Yearly, Status: Active / Expired / Renewal Requested, Renewal Date).
  - **Self-Service Subscription Renewal**:
    - "Renew Subscription" button visible when status is `active` or `expired`.
    - Clicking sends request (`subscriptionService.requestRenewal`), setting status to `renewal_requested` with timestamp `renewalRequestedAt`.
    - Displays non-interactive state: "Renewal requested — awaiting confirmation".
  - Status filter tabs (**All Projects**, **In Progress**, **Completed**).
- **Route**: `/dashboard/projects/:id`
  - High-resolution product image and order metadata.
  - Pipeline status progress stepper.
  - **Dynamic QR Code rendering**: rendered using `qrcode.react`, pointing to `arViewerUrl`.
  - **Strict Security Rule**: **NO "Download GLB" button** is available to clients.
  - **Expired Subscription Lockout**: If client subscription is expired, the QR code is hidden and replaced with an "AR Access Deactivated — Renew Subscription to Continue" banner.

### 4.3 Admin Portal & Workflow Management
- **Overview Dashboard (`/admin`)**: Metric cards for total orders, pending reviews, active AR models in progress, completed orders, and subscription alerts.
- **Client Directory & Detail (`/admin/clients` & `/admin/clients/:email`)**:
  - `/admin/clients`: Directory listing unique clients aggregated by `clientEmail`, displaying client name, email, total order count, subscription plan/status, and latest order status.
  - `/admin/clients/:email`: Client detail page displaying client subscription overview and a full table of all orders for that client.
  - In `/admin/orders` table, client names link directly to `/admin/clients/:email`.
- **Order Creation (`/admin/orders/new`)**: Form to register a new order with Client Email, Product Name, Category, Description, and raw scan asset dropzone. Auto-generates Order ID.
- **Order List (`/admin/orders`)**: Filterable table with search by Email or Order ID, status badges, creation dates, and action links.
- **Order Detail (`/admin/orders/:id`)**: View raw scan files, update pipeline stages, upload `.glb` file, set Completed status.
- **Subscription Management (`/admin/subscriptions`)**:
  - Table of all client subscriptions with "Renewal Requested" tab filter.
  - **Confirm Renewal Action**: Confirms pending renewal request, extending `renewalDate` by the current plan's period (1 month or 1 year) and returning status to `active`.
  - **Plan Mutation Restriction**: Subscription `plan` (Monthly/Yearly) remains strictly admin-only and cannot be mutated by clients.

### 4.4 Global Navigation & Notification System
- **Header**: Immverse logo, role badge (`Client` or `Admin`), Navigation bar including "Clients" link for admins, Theme Toggle, Notification Bell, and Logout button.
- **Notification System**:
  - Interactive Bell dropdown listing real-time or mocked system alerts ("AR Model Ready for Review", "Subscription Expiring Soon", "New Renewal Request Submitted").
  - Unread count badge indicator.
  - Global Toast notifications for async user feedback.

---

## 5. Non-Functional Requirements
- **Performance**: Initial load time $< 1.5\text{s}$, smooth 60fps animations.
- **Responsiveness**: Mobile-first UI for Client views; desktop-optimized view for Admin operations.
- **Accessibility (a11y)**: Focus rings on interactive elements, keyboard navigation, aria labels for status indicators, respect `prefers-reduced-motion`.
- **Branding Parity**: Direct token alignment with Immverse Studios identity (`#2D5BFF` accent, Plus Jakarta Sans, Inter, JetBrains Mono fonts).

---

## 6. Revision History & Changelog

| Date | Version | Description |
| :--- | :--- | :--- |
| **2026-07-27** | v1.0.0 | Initial release of PRD for Immverse AR Client & Admin Web Portal. |
| **2026-07-28** | v1.1.0 | Added multi-order session hardening per client email, self-service subscription renewal workflow (`renewal_requested` status), dedicated Admin Client Directory (`/admin/clients` & `/admin/clients/:email`), and explicit subscription plan mutation restriction guardrail. |
