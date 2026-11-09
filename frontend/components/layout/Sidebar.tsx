"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UploadCloud,
  FileSpreadsheet,
  ShieldAlert,
  BarChart3,
  Lightbulb,
  Terminal,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Upload & Ingest", href: "/datasets/upload", icon: UploadCloud },
    { label: "Developer API", href: "/developer", icon: Terminal },
  ];

  return (
    <aside className="w-64 hidden lg:flex flex-col gap-6 shrink-0">
      <div className="diwali-card p-4 flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted px-2.5 mb-1">
          Navigation
        </span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary-light text-primary font-semibold border-l-4 border-primary"
                  : "text-text-muted hover:text-text hover:bg-surface/50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-gold"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="diwali-card p-4 bg-gradient-to-br from-surface to-primary-light/30 border border-border">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-text uppercase tracking-wider">Cloud Privacy</span>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          Your datasets are evaluated strictly in ephemeral server RAM. No raw records are saved to disk or Supabase Storage.
        </p>
      </div>
    </aside>
  );
}

