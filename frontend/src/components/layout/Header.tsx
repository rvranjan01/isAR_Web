import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { NotificationBell } from "./NotificationBell";
import {
  Sun,
  Moon,
  LogOut,
  Box,
  Layers,
  Users,
  PlusCircle,
  UserCheck,
  Menu,
  X,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AnimatePresence, motion } from "framer-motion";

// ─── Nav item shape ───────────────────────────────────────────────────────────
interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  /** Use startsWith for prefix-matching (e.g. /admin/clients) */
  matchPrefix?: boolean;
}

// ─── Role-scoped nav definitions ─────────────────────────────────────────────
const CLIENT_NAV: NavItem[] = [
  {
    to: "/dashboard",
    label: "My Projects",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
];

const ADMIN_NAV: NavItem[] = [
  {
    to: "/admin",
    label: "Overview",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    to: "/admin/orders",
    label: "Orders",
    icon: <Layers className="w-4 h-4" />,
  },
  {
    to: "/admin/orders/new",
    label: "Create Order",
    icon: <PlusCircle className="w-4 h-4" />,
  },
  {
    to: "/admin/clients",
    label: "Clients",
    icon: <UserCheck className="w-4 h-4" />,
    matchPrefix: true,
  },
  {
    to: "/admin/subscriptions",
    label: "Subscriptions",
    icon: <Users className="w-4 h-4" />,
  },
];

// ─── Shared active-link helper ────────────────────────────────────────────────
function useNavActive(item: NavItem, pathname: string): boolean {
  if (item.matchPrefix) return pathname.startsWith(item.to);
  return pathname === item.to;
}

// ─── Desktop nav link ─────────────────────────────────────────────────────────
const DesktopNavLink: React.FC<{ item: NavItem; pathname: string }> = ({
  item,
  pathname,
}) => {
  const active = useNavActive(item, pathname);
  return (
    <Link
      to={item.to}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
        active
          ? "bg-[var(--surface-soft)] text-[#2D5BFF] font-semibold"
          : "text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-soft)]"
      }`}
    >
      {item.icon}
      {item.label}
    </Link>
  );
};

// ─── Mobile nav link ──────────────────────────────────────────────────────────
const MobileNavLink: React.FC<{
  item: NavItem;
  pathname: string;
  onClick: () => void;
}> = ({ item, pathname, onClick }) => {
  const active = useNavActive(item, pathname);
  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
        active
          ? "bg-[#2D5BFF]/10 text-[#2D5BFF] font-semibold"
          : "text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-soft)]"
      }`}
    >
      {item.icon}
      {item.label}
    </Link>
  );
};

// ─── Main Header ──────────────────────────────────────────────────────────────
export const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";
  const navItems = isAuthenticated ? (isAdmin ? ADMIN_NAV : CLIENT_NAV) : [];

  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mobileOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleMobileClose = () => setMobileOpen(false);

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    navigate("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[var(--contrast)] bg-[var(--surface)]/90 backdrop-blur-md transition-colors">
        {/*
          Desktop layout: logo (shrink-0) | nav (flex-1 overflow-x-auto) | controls (shrink-0)
          This three-section pattern ensures the nav never squeezes the logo or controls,
          even with 5 admin links at 1280px.
        */}
        <div className="mx-auto flex h-16 w-full items-center px-4 sm:px-6 lg:px-8 gap-4">
          {/* ── Logo + role badge (shrink-0 so it never collapses) ── */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://immversestudios.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 group cursor-pointer"
              title="Go to Immverse Studios Marketing Site"
            >
              <div className="flex h-15 w-15 items-center justify-center rounded-xl text-white shadow-glow group-hover:scale-105 transition-transform shrink-0">
                <img
                  src="/immverse.png"
                  alt="Immverse Studios"
                  className="h-15 w-15 object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-extrabold text-base tracking-tight text-[var(--ink)] leading-tight">
                  IMMVERSE <span className="text-[#2D5BFF]">STUDIOS</span>
                </span>
              </div>
            </a>

            {/* Role badge — client only; admin nav items already signal context */}
            {isAuthenticated && !isAdmin && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium shrink-0 bg-[#2D5BFF]/15 text-[#2D5BFF] border border-[#2D5BFF]/30">
                CLIENT PORTAL
              </span>
            )}
          </div>

          {/*
            ── Desktop nav (hidden below md, flex-1 so it fills available space,
            overflow-x-auto to handle very narrow desktops gracefully)
          */}
          {isAuthenticated && (
            <nav
              className="hidden md:flex flex-1 items-center justify-center gap-0.5"
              aria-label="Main navigation"
            >
              {navItems.map((item) => (
                <DesktopNavLink
                  key={item.to}
                  item={item}
                  pathname={location.pathname}
                />
              ))}
            </nav>
          )}

          {/* Spacer on mobile so right-side controls stay right-aligned */}
          {isAuthenticated && (
            <div className="flex-1 md:hidden" aria-hidden="true" />
          )}

          {/* ── Right side controls (shrink-0 so they never collapse) ── */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-soft)] transition-colors cursor-pointer"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              )}
            </button>

            {/* Notifications bell (desktop only — also visible in mobile menu) */}
            {isAuthenticated && (
              <span className="hidden md:flex">
                <NotificationBell />
              </span>
            )}

            {/* Logout (desktop) — single-line identity label with full name on title tooltip */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-2 border-l border-[var(--contrast)] pl-3">
                <span
                  className="hidden lg:inline-block text-xs font-semibold text-[var(--ink-soft)] max-w-[96px] truncate cursor-default"
                  title={user?.name || user?.email || ""}
                >
                  {/* Show a short role label for admin to avoid long name truncation */}
                  {isAdmin
                    ? (user?.name?.split(" ")[0] ?? "Admin")
                    : user?.name || user?.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  leftIcon={<LogOut className="w-4 h-4" />}
                  title={`Log out (${user?.name || user?.email})`}
                >
                  <span className="hidden lg:inline">Logout</span>
                </Button>
              </div>
            )}

            {/* Login button (unauthenticated) */}
            {!isAuthenticated && (
              <Link to="/login">
                <Button variant="primary" size="sm">
                  Login
                </Button>
              </Link>
            )}

            {/* ── Hamburger toggle (mobile only, md:hidden) ── */}
            {isAuthenticated && (
              <button
                ref={triggerRef}
                onClick={() => setMobileOpen((prev) => !prev)}
                className="md:hidden p-2 rounded-xl text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-soft)] transition-colors cursor-pointer"
                aria-label={
                  mobileOpen ? "Close navigation menu" : "Open navigation menu"
                }
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav-panel"
              >
                {mobileOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile nav panel (rendered outside the sticky header to avoid z-index/scroll issues) ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mobile-nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
              aria-hidden="true"
              onClick={handleMobileClose}
            />

            {/* Slide-down panel */}
            <motion.div
              key="mobile-nav-panel"
              id="mobile-nav-panel"
              ref={menuRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed top-16 left-0 right-0 z-35 md:hidden bg-[var(--surface)] border-b border-[var(--contrast)] shadow-xl"
              style={{ zIndex: 39 }}
            >
              <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">
                {/* Nav links */}
                {navItems.map((item) => (
                  <MobileNavLink
                    key={item.to}
                    item={item}
                    pathname={location.pathname}
                    onClick={handleMobileClose}
                  />
                ))}

                {/* Divider */}
                <div className="border-t border-[var(--contrast)] my-3" />

                {/* Notifications row */}
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)]">
                    Notifications
                  </span>
                  <NotificationBell />
                </div>

                {/* User info + logout */}
                <div className="px-4 py-3 rounded-xl bg-[var(--surface-soft)] border border-[var(--contrast)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--ink)] truncate">
                        {user?.name || user?.email}
                      </div>
                      <div className="text-xs font-mono text-[var(--ink-soft)] truncate">
                        {user?.companyName || user?.email}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      leftIcon={<LogOut className="w-4 h-4" />}
                    >
                      Logout
                    </Button>
                  </div>
                </div>

                {/* Theme toggle row */}
                <button
                  onClick={() => {
                    toggleTheme();
                    handleMobileClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-soft)] transition-colors"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Switch to Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4" />
                      <span>Switch to Dark Mode</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
