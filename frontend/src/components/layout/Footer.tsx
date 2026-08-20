import React from "react";
import { Box } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[var(--contrast)] bg-[var(--surface)]/50 py-8 text-xs text-[var(--ink-soft)] mt-auto transition-colors">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          {/* <Box className="w-4 h-4 text-[#2D5BFF]" /> */}

          <div className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-glow group-hover:scale-105 transition-transform shrink-0">
            <img
              src="/immverse.png"
              alt="Immverse Studios"
              className="h-8 w-8 object-contain"
            />
          </div>

          <span className="font-heading font-semibold text-[var(--ink)]">
            Immverse Studios
          </span>
          <span>
            © {new Date().getFullYear()} Immverse Studios Inc. All rights
            reserved.
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://immversestudios.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--ink)] hover:underline transition-colors"
          >
            Home Page
          </a>
          <a
            href="https://immversestudios.com/services/weddings"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--ink)] hover:underline transition-colors"
          >
            Teleport 3D
          </a>
          <a
            href="https://immversestudios.com/services/restaurants"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--ink)] hover:underline transition-colors"
          >
            AuRa AR Menu
          </a>
          {/* <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            System Operational
          </span> */}
        </div>
      </div>
    </footer>
  );
};
