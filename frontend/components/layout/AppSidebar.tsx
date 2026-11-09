"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  FolderArchive,
  Terminal,
  ShieldCheck,
} from "lucide-react";

export default function AppSidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Overview",
      href: "/app",
      icon: LayoutDashboard,
      active: pathname === "/app",
    },
    {
      name: "New Analysis",
      href: "/app/upload",
      icon: PlusCircle,
      active: pathname.startsWith("/app/upload") || pathname.startsWith("/datasets/upload"),
    },
    {
      name: "My Analyses",
      href: "/app/analyses",
      icon: FolderArchive,
      active: pathname.startsWith("/app/analyses"),
    },
    {
      name: "Developer API",
      href: "/app/developer",
      icon: Terminal,
      active: pathname.startsWith("/app/developer") || pathname.startsWith("/developer"),
    },
  ];

  return (
    <aside className="w-60 flex-shrink-0 hidden md:flex flex-col gap-4">
      <nav className="flex flex-col gap-1.5 p-2 bg-white rounded-2xl border border-grey-border shadow-xs">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                item.active
                  ? "bg-charcoal text-white shadow-xs"
                  : "text-grey-muted hover:text-charcoal hover:bg-grey-subtle"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  item.active ? "text-yellow" : "text-grey-muted"
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Compact Privacy Status Indicator */}
      <div className="mt-auto px-3.5 py-2.5 rounded-xl bg-white border border-grey-border shadow-2xs flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-charcoal text-[11px]">Memory-Only Mode</span>
        </div>
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
      </div>
    </aside>
  );
}
