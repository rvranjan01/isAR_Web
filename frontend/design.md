# Design System & Token Specification — Immverse Studios AR Portal

## 1. Brand Aesthetics & Visual Identity
The Immverse Studios AR Portal extends the premium dark/light visual language of the core **Teleport** & **AuRa** marketing presence. It utilizes rich glassmorphism, dynamic gradients, smooth micro-animations, scannable status indicators, and crisp typography.

---

## 2. Color Palette & Token Definitions

### Brand Colors
```ts
colors: {
  accent: {
    DEFAULT: '#2D5BFF', // Immverse Electric Blue
    dark: '#1F46E0',    // Hover & Active state blue
    soft: '#EAF0FF',    // Light background tint blue
  },
  ink: {
    DEFAULT: 'var(--ink)',       // Dynamic text primary color
    soft: 'var(--ink-soft)',     // Dynamic text secondary color
  },
  paper: {
    DEFAULT: 'var(--paper)',     // Main background color
    dim: 'var(--paper-dim)',     // Secondary page background
  },
  surface: {
    DEFAULT: 'var(--surface)',   // Card & Container surface background
    soft: 'var(--surface-soft)', // Input & Modal background
  },
  contrast: {
    DEFAULT: 'var(--contrast)', // Dynamic border & divider color
  }
}
```

### Theme CSS Custom Properties (`src/styles/index.css`)
```css
@import "tailwindcss";

:root {
  --paper: #F8FAFC;
  --paper-dim: #F1F5F9;
  --ink: #0F172A;
  --ink-soft: #475569;
  --surface: #FFFFFF;
  --surface-soft: #F8FAFC;
  --contrast: #E2E8F0;
  --accent: #2D5BFF;
  --accent-dark: #1F46E0;
  --accent-soft: #EAF0FF;
}

.dark {
  --paper: #0B0F19;
  --paper-dim: #07090E;
  --ink: #F8FAFC;
  --ink-soft: #94A3B8;
  --surface: #111827;
  --surface-soft: #1F2937;
  --contrast: #1E293B;
  --accent: #2D5BFF;
  --accent-dark: #3B82F6;
  --accent-soft: rgba(45, 91, 255, 0.15);
}
```

---

## 3. Typography
- **Headings**: `Plus Jakarta Sans`, sans-serif (Font weights: 600, 700, 800)
- **Body**: `Inter`, sans-serif (Font weights: 400, 500, 600)
- **Code / Identifiers / Order IDs**: `JetBrains Mono`, monospace (Font weights: 400, 500)

```ts
fontFamily: {
  heading: ['"Plus Jakarta Sans"', 'sans-serif'],
  body: ['Inter', 'sans-serif'],
  mono: ['"JetBrains Mono"', 'monospace'],
}
```

---

## 4. Shadow & Glow Effects
```ts
boxShadow: {
  glow: '0 8px 24px rgba(45, 91, 255, 0.28)',
  'glow-lg': '0 16px 48px rgba(45, 91, 255, 0.22)',
}
```

---

## 5. Pipeline Status Badge Color Palette

Every order status maps to a dedicated, high-contrast visual badge:

| Status | Badge Background (Light) | Text Color (Light) | Badge Background (Dark) | Text Color (Dark) | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Uploaded` | `#F3F4F6` | `#374151` | `rgba(156, 163, 175, 0.15)` | `#D1D5DB` | Scan metadata uploaded |
| `Pending Review` | `#FEF3C7` | `#92400E` | `rgba(245, 158, 11, 0.15)` | `#FBBF24` | Awaiting team review |
| `AR In Progress` | `#DBEAFE` | `#1E40AF` | `rgba(59, 130, 246, 0.15)` | `#60A5FA` | 3D modeler active |
| `Quality Check` | `#F3E8FF` | `#6B21A8` | `rgba(168, 85, 247, 0.15)` | `#C084FC` | Internal QA testing |
| `Completed` | `#D1FAE5` | `#065F46` | `rgba(16, 185, 129, 0.15)` | `#34D399` | 3D asset & QR generated |
| `Delivered` | `#ECFDF5` | `#047857` | `rgba(5, 150, 105, 0.2)` | `#10B981` | Client accepted & live |

### Subscription Status Badge Palette (added 2026-07-29)

| Status | Badge Background | Text Color | Border | Description |
| :--- | :--- | :--- | :--- | :--- |
| `active` | `rgba(16, 185, 129, 0.15)` | `#10B981` (emerald-500) | `rgba(16, 185, 129, 0.30)` | Subscription live & AR QR enabled |
| `renewal_requested` | `rgba(245, 158, 11, 0.15)` | `#F59E0B` (amber-500) | `rgba(245, 158, 11, 0.30)` | Client-requested, pending admin confirmation. Amber/pending tone — distinct from active (green) and expired (red). Use `Clock` icon. |
| `expired` | `rgba(239, 68, 68, 0.15)` | `#EF4444` (red-500) | `rgba(239, 68, 68, 0.30)` | Subscription lapsed, AR QR deactivated |

---

## 6. Layout Guidelines & Micro-Interactions
- **Responsive Layout**: Mobile-first design for Client Dashboard (`<640px`), expanding to grid views on desktop (`>1024px`).
- **Cards**: Surface background with soft border (`border-contrast`), rounded corners (`rounded-xl` or `rounded-2xl`), and subtle elevation.
- **Buttons**:
  - Primary: `bg-accent text-white hover:bg-accent-dark shadow-glow`
  - Secondary: `bg-surface-soft text-ink hover:bg-contrast`
  - Outline: `border border-contrast text-ink hover:bg-surface-soft`
  - Danger: `bg-red-600 text-white hover:bg-red-700`
- **Animations**: Framer Motion page transitions with ease-out curve, scale-on-hover micro-interactions for buttons, smooth fade-in modals. Respect `prefers-reduced-motion`.
