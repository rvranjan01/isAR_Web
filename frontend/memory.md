# Memory Log — Immverse Studios AR Portal

## Key Decisions

- **Standalone Repository Structure**: This portal is built in a **new, dedicated repository** (`portal.immversestudios.com`). It does not share code, dependencies, or build scripts with the marketing site.
- **Tech Stack Alignment**: Strict parity with Immverse Studios tech stack:
  - React 19 + TypeScript (`strict: true`)
  - Vite 8 (`@vitejs/plugin-react`)
  - Tailwind CSS v4 (`@tailwindcss/vite` plugin, `@config` directive pattern)
  - React Router v7 (`react-router-dom`)
  - `react-hook-form` + `Zod` (`@hookform/resolvers`)
  - Framer Motion (`AnimatePresence`) for page transitions
  - `lucide-react` icons
  - `qrcode.react` for client dynamic QR code generation
  - `oxlint` for linting (`.oxlintrc.json`)
  - `@fontsource` font packages (Plus Jakarta Sans, Inter, JetBrains Mono)
- **HTTP Client**: Native `fetch` wrapped in typed `services/api.ts` (avoiding axios to keep dependencies lean).
- **Frontend-Only Mock API**: Initial version operates on realistic in-memory mock datasets controlled by `VITE_USE_MOCK_API=true`. Switching `VITE_USE_MOCK_API=false` points to `VITE_API_BASE_URL` without component code changes.
- **Client Security Rule**: Clients access AR models via dynamic scannable QR Codes rendered on screen (`qrcode.react`). **No raw 3D `.glb` download buttons** are provided in client views.
- **Deployment Strategy**: Deployed to **Netlify** via **GitHub Actions** (`.github/workflows/ci-cd.yml`). Includes `public/_redirects`, `netlify.toml`, and `vercel.json` for fallback parity.

---

## Open Questions & Assumptions

- **API Contract Formalization**: Backend routes are assumed (`POST /api/auth/login`, `GET /api/projects`, `POST /api/projects`, `PATCH /api/projects/:id/status`, `GET /api/subscriptions`). The service abstraction layer decouples UI from backend implementation details.
- **Notification Persistence**: Real-time push notifications are mocked via `notificationService`. Polling or WebSocket integration will be hooked up when the production backend API is connected.

---

## Decision Log

### 2026-07-29 — Phase 8: Post-Launch Update

**What changed:**
1. **Multi-order hardening** — `authService.login` now validates that the Order ID belongs to the email before accepting it; session is email-scoped not order-scoped. Mock data adds `techstartup@nova.com` with two distinct order IDs to serve as a clear test case.
2. **Self-service subscription renewal** — Added `renewal_requested` status to the `Subscription` type. Clients can now request renewal from the dashboard; admin must confirm. `requestRenewal()` does not touch `plan`. `confirmRenewal()` extends the date by 1 month or 1 year based on the *current* plan — admin is not prompted here.
3. **Admin Client Directory** — Added `/admin/clients` (aggregated list) and `/admin/clients/:email` (detail page). Both aggregate client-side from existing order data. Client names in the Orders list now link to the detail view.

**Why:**
- Feedback from real usage: clients with multiple orders were confused about session scope.
- Clients wanted to self-initiate renewals without emailing support, but full automation was rejected — admin confirmation ensures billing coordination and no silent renewals.
- Admin needed a "per-client view" without hunting through a flat orders list.

**Design decisions:**
- **Semi-automated renewal** chosen over fully automated (no billing integration yet) and fully manual (creates admin bottleneck). Client requests → admin confirms is the right balance at this stage.
- **Client-side aggregation** for the Client Directory (no new backend entity needed). When the real API ships, it can expose an `orders-by-client` endpoint and the service layer will absorb the change without UI changes.
- **Plan field guardrail codified** in `rules.md` Section 6 as a standing rule, not just a comment.

---

### 2026-07-30 — Header Bug Fixes: Mobile Nav & Admin Desktop Alignment

#### Bug 1 — Mobile Navigation: Root Cause & Fix

**Root cause**: The nav element in `Header.tsx` had the class `hidden md:flex`. There was **no hamburger button, no mobile menu `useState`, no mobile panel, nothing** — navigation was simply invisible on every viewport below 768px. This was a missing implementation, not a broken one. The component was built desktop-first and mobile was never wired up.

**Fix**: Added a full mobile navigation system to the single shared `Header.tsx`:
- `useState(mobileOpen)` controls open/closed state.
- A `Menu`/`X` lucide icon toggle button (hidden above `md`) is rendered in the right-side controls group.
- An `AnimatePresence` + `motion.div` slide-down panel (matching the existing `PageTransition` easing pattern: `duration: 0.22, ease: 'easeOut'`) renders below the sticky header when open, containing all role-scoped nav links, a notification bell row, user info, logout button, and theme toggle.
- A semi-transparent backdrop `motion.div` sits behind the panel; clicking it closes the menu.
- `useEffect` on `location.pathname` closes the menu on any route change.
- `useEffect` listening for `Escape` keydown closes the menu and returns focus to the trigger button (`triggerRef`).
- `document.body.style.overflow = 'hidden'` prevents background scroll while open.
- `aria-expanded`, `aria-controls` on the toggle; `role="dialog"`, `aria-modal="true"`, `aria-label` on the panel — screen-reader accessible.
- Verified breakpoints: menu appears at 375px, 390px, 430px (hamburger visible, panel functional); disappears above 768px (desktop nav takes over with no dead zone).

**Scope**: One shared `Header.tsx` handles both client and admin layouts — both roles get the hamburger automatically because nav items are generated from role-scoped `CLIENT_NAV` / `ADMIN_NAV` arrays.

---

#### Bug 2 — Admin Desktop Header Misalignment: Root Cause & Fix

**Root cause**: The flex row container used `justify-between` with the logo and right-controls as `div`s, and the nav in the middle as a `nav`. The admin nav has **5 links** (Overview, Orders, Create Order, Clients, Subscriptions) vs the client nav's 1. At 1280px, these 5 links plus the logo section (`gap-6`) and the right controls (theme toggle + bell + separator + name + logout) all competed for the same 64px-height flex row. The nav had no `flex-1` or `min-width` constraint, so it either overflowed or pushed the right controls off-screen. Additionally, user name/email had no `truncate` + `max-w` guard, so long admin names could break alignment at 1440px and 1920px.

**Fix (Revised for full width & exact spacing)**:
- **Removed container max-width**: Changed `max-w-7xl` to `w-full` on the main header flex container. This was an artificial constraint preventing the header from using the full screen width on standard 1920px monitors.
- Restructured the flex row into a **three-section pattern**: `[logo (shrink-0)] [nav (flex-1)] [controls (shrink-0)]`. The nav now expands to fill available space between the two fixed-width flanks rather than colliding with them.
- **Removed "ADMIN PORTAL" badge** for admins to save ~105px of width (the context is already obvious from the nav items).
- **Tightened Nav Spacing**: Reduced horizontal padding on `DesktopNavLink` to `px-2 py-1.5` (from `px-3`), while keeping the standard icons (to avoid breaking the information architecture).
- **Identity Block Truncation Fix**: Collapsed the right-side identity block from a two-line column to a single line that shows either the admin's first name or their email. Applied `max-w-[96px] truncate` so it doesn't push the logout button out of bounds, and added the full name as a title tooltip.
- **Removed fallback scroll**: The nav no longer has `overflow-x-auto`, as the width is fully adequate now. No custom arrow-scroll fallback is required.

**Verification**: TypeScript (`tsc --noEmit`) clean, oxlint 0 warnings/0 errors, `npm run build` passes (`✓ built in ~3s`).
