# Immverse Studios — AR Client & Admin Portal

A modern, high-performance web portal built for **Immverse Studios** clients (AuRa AR Menus & Teleport 3D Twins) and internal operations staff.

Clients log in using passwordless authentication (**Email + Order ID**) to track 3D model production status and access scannable Web AR experience QR codes. Immverse admins manage incoming client orders, advance production pipeline stages, upload final 3D files (`.glb`/`.gltf`/`.usdz`), and manage client subscription plans.

---

## 🛠️ Tech Stack & Parity

- **Framework**: React 19 + TypeScript (`strict: true`)
- **Build Tool**: Vite 8 (`@vitejs/plugin-react`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`, `@config` CSS directive pattern)
- **Routing**: React Router v7 (`react-router-dom`)
- **Forms & Validation**: `react-hook-form` + `Zod` (`@hookform/resolvers`)
- **Animations**: Framer Motion (`AnimatePresence`) for page transitions
- **Icons**: `lucide-react`
- **QR Code Engine**: `qrcode.react` (SVG mode)
- **Linting**: `oxlint` (`.oxlintrc.json`)
- **Typography**: `@fontsource/plus-jakarta-sans`, `@fontsource/inter`, `@fontsource/jetbrains-mono`
- **HTTP Client**: Typed native `fetch` client in `src/services/api.ts`

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- Node.js LTS (v20+ recommended)
- npm v10+

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/immversestudios/ar-portal.git
cd ar-portal

# Install dependencies
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default `.env` configuration:
```env
VITE_API_BASE_URL=https://api.immversestudios.com
VITE_USE_MOCK_API=true
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Demo Credentials

Quick demo buttons are available on the login page (`/login`):

| User Role | Email Address | Order ID | Access Scope |
| :--- | :--- | :--- | :--- |
| **Client** | `client@restaurant.com` | `ORD-8942` | Access Client Dashboard (`/dashboard`), view projects, scan Web AR QR Code |
| **Admin** | `admin@immversestudios.com` | `ADMIN-PORTAL-KEY` | Access Admin Panel (`/admin`), create orders, upload `.glb` models, edit subscriptions |

---

## 🔄 Mock API vs Production Backend API Switch

The app features a swappable service layer in `src/services/`.

- **Mock Mode (`VITE_USE_MOCK_API=true`)**: Reads/writes to in-memory datasets (`src/services/mocks/data.ts`) with realistic network latency simulations. No backend server required!
- **Production Mode (`VITE_USE_MOCK_API=false`)**: Automatically routes all requests to `VITE_API_BASE_URL` with JWT `Authorization: Bearer <token>` headers attached.

---

## ⚙️ CI/CD & Deployment Pipeline

This repository is configured for automated deployment to **Netlify** via **GitHub Actions** (`.github/workflows/ci-cd.yml`).

### Workflow Jobs
1. **`build-and-lint`** (Runs on every push & PR):
   - Executes `npm ci`
   - Executes `npm run lint` (`oxlint`)
   - Executes `npm run build` (`tsc -b && vite build`)
2. **`deploy`** (Runs after build succeeds):
   - **Pull Requests**: Deploys a Netlify **Preview Deployment** and posts the live URL as a PR comment.
   - **Push to `main`**: Deploys directly to Netlify **Production**.

### Required GitHub Repository Secrets
To enable automated deployments, configure the following secrets in GitHub Repository Settings $\rightarrow$ Secrets and variables $\rightarrow$ Actions:

- `NETLIFY_AUTH_TOKEN`: Your Netlify Personal Access Token.
- `NETLIFY_SITE_ID`: Your Netlify Site API ID.

---

## 📁 Repository Structure & Documentation

The root folder contains 6 persistent planning documents:

- [`prd.md`](./prd.md) — Product Requirements Document (Personas, User Flow, Acceptance Criteria)
- [`Architecture.md`](./Architecture.md) — System Architecture, Folder Blueprint, Data Models
- [`rules.md`](./rules.md) — Coding Standards, TypeScript Strictness, Git Commit Rules
- [`phases.md`](./phases.md) — Milestone Checklist & Implementation Roadmap
- [`design.md`](./design.md) — Design Tokens, Brand Colors (`#2D5BFF`), Status Badge Palette
- [`memory.md`](./memory.md) — Running Decisions Log & Architectural Assumptions
