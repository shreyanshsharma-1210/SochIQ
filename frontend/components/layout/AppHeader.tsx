"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SochIQLogo from "@/components/brand/SochIQLogo";
import { useDatasetSession } from "@/context/DatasetSessionContext";
import {
  Terminal,
  ShieldCheck,
  ExternalLink,
  Menu,
  X,
  LayoutDashboard,
  PlusCircle,
  FolderArchive,
  RotateCcw
} from "lucide-react";

export default function AppHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isExpired, refreshSession } = useDatasetSession();

  const navItems = [
    { name: "Overview", href: "/app", icon: LayoutDashboard },
    { name: "New Analysis", href: "/app/upload", icon: PlusCircle },
    { name: "My Analyses", href: "/app/analyses", icon: FolderArchive },
    { name: "Developer API", href: "/app/developer", icon: Terminal },
  ];

  return (
    <header className="w-full bg-white border-b border-grey-border sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <SochIQLogo size="md" href="/app" />
          <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-yellow/20 text-charcoal border border-yellow/40">
            Workspace
          </span>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Workspace Status Indicator (The only status indicator required during normal usage) */}
          {isExpired ? (
            <button
              onClick={refreshSession}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
              title="Workspace expired after inactivity. Click to establish a new workspace."
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Workspace Expired · Reset</span>
            </button>
          ) : (
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-grey-subtle border border-grey-border text-xs font-medium text-charcoal"
              title="Your workspace is active and securely saved in cloud storage."
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Workspace Active · Cloud Persisted</span>
            </div>
          )}

          <Link
            href="/app/developer"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-grey-border text-xs font-semibold text-charcoal hover:bg-grey-subtle transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Developer API</span>
          </Link>

          <Link
            href="/"
            className="text-xs font-medium text-grey-muted hover:text-charcoal px-2 py-1 transition-colors flex items-center gap-1"
            title="Return to Public Landing Page"
          >
            <span>Landing</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-charcoal hover:bg-grey-subtle transition-colors"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-grey-border bg-white px-4 py-3 flex flex-col gap-1.5 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? "bg-charcoal text-white"
                    : "text-grey-muted hover:text-charcoal hover:bg-grey-subtle"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-yellow" : "text-grey-muted"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <div className="mt-2 pt-2 border-t border-grey-border flex flex-col gap-1.5 text-[11px] text-grey-muted px-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Workspace Active · Cloud Persisted</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
