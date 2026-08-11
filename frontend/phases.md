# Build Phases & Milestone Checklist — Immverse Studios AR Portal

## Phase 0 — Foundational Planning Documents
- [x] `prd.md` — Product Requirements Document created
- [x] `Architecture.md` — Technical Architecture & API Contract created
- [x] `rules.md` — Coding Conventions & Lint Rules created
- [x] `phases.md` — Build Roadmap & Progress Checklist created
- [x] `design.md` — Design Tokens & UI Guidelines created
- [x] `memory.md` — Persistent Log & Open Questions created

---

## Phase 1 — Project Setup & Design System Infrastructure
- [x] Scaffold Vite 8 + React 19 + TypeScript project with npm dependencies
- [x] Configure Tailwind CSS v4 in `src/styles/index.css` with custom CSS custom properties (`--ink`, `--paper`, `--surface`, `--accent`)
- [x] Configure `oxlint` with `.oxlintrc.json` and `.oxlintignore`
- [x] Set up Vite `@/` path alias in `vite.config.ts` and `tsconfig.json`
- [x] Install `@fontsource` font packages for Plus Jakarta Sans, Inter, JetBrains Mono
- [x] Implement `ThemeContext` & theme toggle hook (`useTheme`)
- [x] Implement UI atomic primitives (`Button`, `Card`, `Badge`, `Input`, `Modal`, `Skeleton`, `Toast`)
- [x] Implement global layout shell (`Header`, `Footer`, `PageTransition`)

---

## Phase 2 — Authentication & State Management
- [x] Create master TypeScript contracts (`src/types/index.ts`)
- [x] Implement swappable service layer foundation (`api.ts`, mock datasets)
- [x] Implement `authService` (email + order ID passwordless login)
- [x] Implement `AuthContext` with local storage persistence
- [x] Build `/login` page with Client & Admin quick-demo filler buttons
- [x] Implement `ProtectedRoute` with JWT check and role authorization

---

## Phase 3 — Client Portal Implementation
- [x] Implement `projectService` & `subscriptionService`
- [x] Build Client Dashboard page (`/dashboard`)
  - [x] Projects grid displaying active & completed orders
  - [x] Active subscription status card with 3-day expiration alert banner
  - [x] Search and status tab filtering
- [x] Build Project Detail page (`/dashboard/projects/:id`)
  - [x] Product image & metadata display
  - [x] Pipeline stepper indicator
  - [x] Dynamic scannable QR Code rendering (`qrcode.react`)
  - [x] Subscription expiration lockout state (AR access deactivated)

---

## Phase 4 — Admin Management Portal Implementation
- [x] Build Admin Overview page (`/admin`) with pipeline metrics and quick links
- [x] Build Order List page (`/admin/orders`) with status filtering & email search
- [x] Build Order Creation form page (`/admin/orders/new`) with Zod validation
- [x] Build Order Detail page (`/admin/orders/:id`)
  - [x] Asset scan review
  - [x] Stage-by-stage pipeline status updating
  - [x] AR 3D model file uploader (`.glb`, `.gltf`, `.usdz`)
  - [x] Web AR viewer URL generator & live QR preview
- [x] Build Client Subscription Manager page (`/admin/subscriptions`)
  - [x] Client subscriptions table
  - [x] Modal to extend renewal dates or update plan tier

---

## Phase 5 — Notification & Alert System
- [x] Implement `NotificationContext` & `notificationService`
- [x] Build `NotificationBell` header dropdown component with unread badges
- [x] Add trigger simulations for "AR Model Ready" and "Subscription Expiring Soon"
- [x] Integrate toast notifications across all form actions & status updates

---

## Phase 6 — Deployment & CI/CD Pipeline
- [x] Create `.env.example` & `.env` (`VITE_USE_MOCK_API=true`)
- [x] Create Netlify configuration (`netlify.toml` & `public/_redirects`)
- [x] Create Vercel SPA rewrite fallback configuration (`vercel.json`)
- [x] Create GitHub Actions workflow (`.github/workflows/ci-cd.yml`) for lint/build gates and Netlify deployment
- [x] Write comprehensive `README.md`

---

## Phase 7 — QA, Verification & Final Polish
- [x] Run `oxlint` and fix all lint warnings/errors (Verified: 0 warnings, 0 errors)
- [x] Run strict TypeScript compilation (`tsc -b`) (Verified: clean pass)
- [x] Run Vite production build (`vite build`) (Verified: clean pass)
- [x] Perform end-to-end responsive & accessibility testing across viewports

---

## Phase 8 — Post-Launch Update: Multi-Order Hardening, Self-Service Renewal & Client Grouping
> **Date**: 2026-07-29 | **Triggered by**: real usage feedback

### Change 1 — Multi-Order Hardening
- [x] Mock data updated: `techstartup@nova.com` seeded with 2 distinct Order IDs (`ORD-7710`, `ORD-7711`) at different pipeline stages
- [x] `authService.login` hardened: validates that provided Order ID belongs to the provided email; session scoped to email (not order ID)
- [x] Dashboard fetches ALL projects by email; verified via `projectService.getProjects(user.email)`
- [x] Multi-order support documented as explicit requirement in `prd.md`

### Change 2 — Self-Service Subscription Renewal
- [x] `Subscription` type extended: `status` adds `renewal_requested`; `renewalRequestedAt?: string` added
- [x] `subscriptionService.requestRenewal(email)` — client-facing, never touches `plan`
- [x] `subscriptionService.confirmRenewal(id)` — admin-only, extends by plan interval
- [x] `notificationService.addNotification()` added for admin alerts
- [x] Client dashboard: "Renew Subscription" button, pending state, softened banners
- [x] Admin subscriptions: amber alert section, `renewal_requested` tab, "Confirm" action

### Change 3 — Admin Client Directory
- [x] `/admin/clients` (`AdminClientsPage`) — aggregated client list from orders
- [x] `/admin/clients/:email` (`AdminClientDetailPage`) — subscription summary + full orders table
- [x] Admin Orders list: client name/email → links to `/admin/clients/:email`
- [x] Admin nav: "Clients" link added; routes registered in `AppRoutes.tsx`

### Change 4 — Plan Field Guardrail (verification)
- [x] No UI path for clients to change `plan`; only `status`/renewal via `requestRenewal()`
- [x] `rules.md` updated with explicit standing rule
