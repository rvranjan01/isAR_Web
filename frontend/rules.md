# Coding Conventions & Project Rules — Immverse Studios AR Portal

## 1. Code Standards & TypeScript Strictness
- **TypeScript**: Enforce strict type checking (`"strict": true`).
- **No `any`**: Avoid the `any` type at all costs. If unavoidable for external library integration, justify with an inline comment (`// ts-ignore: library typings missing`).
- **Functional Components**: Write pure functional components using React hooks exclusively. No legacy Class components.
- **Single Component Files**: One component per file. Name files in `PascalCase` (e.g. `Button.tsx`, `ProjectDetailPage.tsx`).
- **Hooks & Utilities**: Name custom hooks with camelCase starting with `use` (e.g. `useAuth.ts`). Name utility functions in camelCase (e.g. `formatDate.ts`).

---

## 2. Directory Layout & Organization
- **Pages**: Store route-level entry points under `src/pages/`.
- **UI Components**: Store reusable atomic UI primitives under `src/components/ui/`.
- **Layout Components**: Store layout structures (Header, Footer, Navigation) under `src/components/layout/`.
- **Services**: All API communication and mock adapters must live in `src/services/`. Components **MUST NEVER** invoke native `fetch` directly.
- **Path Aliases**: Always use `@/` path alias for absolute imports from `src/` (e.g., `import { Button } from '@/components/ui/Button'`).

---

## 3. Styling & Micro-Interactions (Tailwind CSS v4)
- Use **Tailwind CSS v4** syntax (`@import "tailwindcss";`) configured via `@config` directive.
- Apply design tokens strictly (`accent`, `--ink`, `--paper`, `--surface`, `--contrast`).
- Ensure accessible focus rings (`focus-visible:ring-2 focus-visible:ring-accent`).
- Respect user motion preferences by applying `motion-safe:` prefixes or checking `prefers-reduced-motion` in Framer Motion animations.

---

## 4. Linting & Formatting Standards (oxlint)
- Code linting is enforced via **oxlint** using `.oxlintrc.json`.
- Rules specified include `react`, `typescript`, and `oxc` plugin standards.
- Rule `react/rules-of-hooks` is set to `"error"`.
- Clean up unused imports and variables before committing.

---

## 5. Git Commit & PR Conventions
Follow the **Conventional Commits** specification:
- `feat:` New user-facing feature or page
- `fix:` Bug fix or logic correction
- `chore:` Dependency update, configuration adjustment, or scaffolding
- `docs:` Documentation changes (`.md` files)
- `ci:` Workflow and pipeline setup (`.github/workflows`)

### CI Gate Requirement:
Every Pull Request must pass `npm run lint` (oxlint) and `npm run build` (`tsc -b && vite build`) without warnings or errors prior to merge into `main`.

---

## 6. Subscription Data Rules (Standing Guardrails)

> **Added**: 2026-07-29 | Post-launch update

- **Plan field is admin-only** — The `Subscription.plan` field (`'monthly' | 'yearly'`) may **only** be mutated from `/admin/subscriptions`. No client-facing component, hook, or service call may read or write `plan` with intent to change it. `subscriptionService.requestRenewal()` explicitly must not accept or pass a `plan` parameter.
- **Renewal flow is semi-automated** — Clients may call `subscriptionService.requestRenewal(email)` to set `status = 'renewal_requested'`. Only admin can call `subscriptionService.confirmRenewal(id)` to transition back to `active` and extend the `renewalDate`.
- **Session is email-scoped** — Login validates Email + Order ID pair, but the resulting session token and all data fetches are scoped to the **email**. The `orderId` used at login is NOT the session anchor; the dashboard always fetches all orders for the authenticated email.
