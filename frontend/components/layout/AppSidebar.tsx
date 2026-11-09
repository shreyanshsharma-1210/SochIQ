"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UploadCloud, Terminal, ShieldCheck, Sparkles } from "lucide-react";

export default function AppSidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dashboard",
      href: "/app",
      icon: LayoutDashboard,
      active: pathname === "/app",
    },
    {
      name: "Upload & Ingest",
      href: "/app/upload",
      icon: UploadCloud,
      active: pathname.startsWith("/app/upload") || pathname.startsWith("/datasets/upload"),
    },
    {
      name: "Developer API",
      href: "/app/developer",
      icon: Terminal,
      active: pathname.startsWith("/app/developer") || pathname.startsWith("/developer"),
    },
  ];

  return (
    <aside className="w-60 flex-shrink-0 hidden md:flex flex-col gap-6">
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

      {/* Cloud Privacy Card */}
      <div className="p-4 rounded-2xl bg-white border border-grey-border shadow-xs flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-yellow/20 flex items-center justify-center text-charcoal">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-xs text-charcoal">Cloud Privacy</h4>
            <span className="text-[10px] text-emerald-700 font-semibold">Active Session</span>
          </div>
        </div>
        <p className="text-[11px] text-grey-muted leading-relaxed">
          Raw dataset rows are processed strictly in volatile memory. No permanent cloud storage.
        </p>
      </div>

      {/* Quick Tips */}
      <div className="p-3.5 rounded-2xl bg-grey-subtle/70 border border-grey-border text-[11px] text-grey-muted flex items-start gap-2">
        <Sparkles className="w-3.5 h-3.5 text-yellow shrink-0 mt-0.5" />
        <span>Tip: Save metadata profiles to compare datasets without uploading files again.</span>
      </div>
    </aside>
  );
}
