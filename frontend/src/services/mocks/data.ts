import { Project, Subscription, Notification, User } from "@/types";

export const INITIAL_USERS: User[] = [
  {
    id: "usr-client-1",
    email: "client@restaurant.com",
    role: "client",
    name: "Ranjan",
    companyName: "Bomato",
    orderId: "ORD-8942",
  },
  {
    id: "usr-client-2",
    email: "realestate@apex.com",
    role: "client",
    name: "Abhinandan",
    companyName: "Mehra Properties",
    orderId: "ORD-5501",
  },
  {
    // Multi-order demo client: has 2 distinct Order IDs (ORD-7710 and ORD-7711)
    // Login with EITHER order ID; dashboard always shows ALL orders for this email.
    id: "usr-client-3",
    email: "techstartup@nova.com",
    role: "client",
    name: "Priya Nair",
    companyName: "Nova Interiors",
    orderId: "ORD-7710",
  },
  {
    id: "usr-admin-1",
    email: "admin@immversestudios.com",
    role: "admin",
    name: "Alex Mercer (Immverse Operations)",
    companyName: "Immverse Studios",
  },
];

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "sub-1",
    clientEmail: "client@restaurant.com",
    clientName: "Bomato",
    plan: "yearly",
    status: "active",
    renewalDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // Expiring in 2 days!
    startDate: "2025-07-29",
  },
  {
    id: "sub-2",
    clientEmail: "realestate@apex.com",
    clientName: "Mehra Properties",
    plan: "monthly",
    status: "active",
    renewalDate: "2026-10-15",
    startDate: "2025-10-15",
  },
  {
    id: "sub-3",
    clientEmail: "oldclient@cafe.com",
    clientName: "Retro Cafe",
    plan: "monthly",
    status: "renewal_requested",
    renewalDate: "2026-01-01",
    startDate: "2025-01-01",
    renewalRequestedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // Requested 1 hour ago
  },
  {
    id: "sub-4",
    clientEmail: "techstartup@nova.com",
    clientName: "Nova Interiors",
    plan: "yearly",
    status: "expired",
    renewalDate: "2026-06-01",
    startDate: "2025-06-01",
  },
];

export const INITIAL_PROJECTS: Project[] = [
  // ── client@restaurant.com — 3 projects under ORD-8942 ──────────────────────
  {
    id: "proj-8942-1",
    orderId: "ORD-8942",
    clientEmail: "client@restaurant.com",
    clientName: "Bistro Lumière",
    productName: "Signature Wagyu Steak AR Experience",
    productCategory: "AuRa AR Menu",
    description:
      "Ultra-realistic 3D AR menu model showcasing sizzle, texture, and wine pairing for table display.",
    status: "Completed",
    productImageUrl:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    arModelUrl: "https://assets.immversestudios.com/models/wagyu_steak.glb",
    arViewerUrl: "https://ar.immversestudios.com/view/proj-8942-1",
    createdAt: "2026-07-10T10:00:00Z",
    updatedAt: "2026-07-15T14:30:00Z",
    notes:
      "Scan approved by client. Polygon count optimized for iOS Quick Look and Android WebXR.",
  },
  {
    id: "proj-8942-2",
    orderId: "ORD-8942",
    clientEmail: "client@restaurant.com",
    clientName: "Bistro Lumière",
    productName: "Artisan Molten Lava Cake 3D AR Menu",
    productCategory: "AuRa AR Menu",
    description:
      "Dynamic AR dessert showcase featuring oozing chocolate animation.",
    status: "AR In Progress",
    productImageUrl:
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-07-20T11:20:00Z",
    updatedAt: "2026-07-22T09:15:00Z",
    notes: "Texturing in progress. High-poly sculpting completed.",
  },
  {
    id: "proj-8942-3",
    orderId: "ORD-8942",
    clientEmail: "client@restaurant.com",
    clientName: "Bistro Lumière",
    productName: "Truffle Pasta Delight",
    productCategory: "AuRa AR Menu",
    description: "Detailed food scan awaiting initial internal review.",
    status: "Pending Review",
    productImageUrl:
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-07-25T16:00:00Z",
    updatedAt: "2026-07-25T16:00:00Z",
  },

  // ── realestate@apex.com — 1 project under ORD-5501 ─────────────────────────
  {
    id: "proj-5501-1",
    orderId: "ORD-5501",
    clientEmail: "realestate@apex.com",
    clientName: "Mehra Properties",
    productName: "Luxury Penthouse 3D Twin Walkthrough",
    productCategory: "Teleport 3D Twin",
    description:
      "360 degree 3D digital twin spatial walkthrough for penthouse sales presentation.",
    status: "Completed",
    productImageUrl:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
    arModelUrl: "https://assets.immversestudios.com/models/penthouse_twin.glb",
    arViewerUrl: "https://ar.immversestudios.com/view/proj-5501-1",
    createdAt: "2026-06-01T09:00:00Z",
    updatedAt: "2026-06-12T17:00:00Z",
  },

  // ── techstartup@nova.com — 2 distinct Order IDs (ORD-7710 & ORD-7711) ──────
  // Demonstrates: login with either ORD-7710 or ORD-7711 → dashboard shows both
  {
    id: "proj-7710-1",
    orderId: "ORD-7710",
    clientEmail: "techstartup@nova.com",
    clientName: "Nova Interiors",
    productName: "Co-working Space 3D Twin — Bangalore HQ",
    productCategory: "Teleport 3D Twin",
    description:
      "Full spatial 3D digital twin of the Nova co-working flagship space for virtual leasing.",
    status: "Quality Check",
    productImageUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-07-01T09:00:00Z",
    updatedAt: "2026-07-18T11:00:00Z",
    notes: "QC review underway. Final texture pass pending sign-off.",
  },
  {
    id: "proj-7711-1",
    orderId: "ORD-7711",
    clientEmail: "techstartup@nova.com",
    clientName: "Nova Interiors",
    productName: "Modular Office Pod AR Showcase",
    productCategory: "AuRa AR Menu",
    description:
      "AR product showcase for Nova's signature modular office pod line.",
    status: "Uploaded",
    productImageUrl:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-07-22T14:30:00Z",
    updatedAt: "2026-07-22T14:30:00Z",
    notes: "Product scan uploaded. Awaiting Immverse team review.",
  },
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    recipientEmail: "client@restaurant.com",
    title: "AR Model Ready!",
    message:
      "Your Signature Wagyu Steak AR Experience has been completed and verified.",
    type: "success",
    read: false,
    createdAt: "2026-07-15T14:35:00Z",
    link: "/dashboard/projects/proj-8942-1",
  },
  {
    id: "notif-2",
    recipientEmail: "client@restaurant.com",
    title: "Subscription Expiring Soon",
    message:
      "Your Bomato AuRa AR subscription expires in 2 days. Renew to maintain live QR access.",
    type: "warning",
    read: false,
    createdAt: "2026-07-26T08:00:00Z",
    link: "/dashboard",
  },
  {
    id: "notif-3",
    recipientEmail: "admin@immversestudios.com",
    title: "New Order Uploaded",
    message: "Bomato submitted Truffle Pasta Delight scan data for review.",
    type: "info",
    read: true,
    createdAt: "2026-07-25T16:02:00Z",
    link: "/admin/orders/proj-8942-3",
  },
  {
    id: "notif-4",
    recipientEmail: "admin@immversestudios.com",
    title: "Renewal Request Received",
    message:
      "Retro Cafe has requested subscription renewal. Review and confirm in the Subscriptions panel.",
    type: "warning",
    read: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    link: "/admin/subscriptions",
  },
];
