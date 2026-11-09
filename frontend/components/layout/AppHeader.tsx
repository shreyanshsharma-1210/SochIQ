"use client";

import Link from "next/link";
import SochIQLogo from "@/components/brand/SochIQLogo";
import { Terminal, ShieldCheck, ExternalLink } from "lucide-react";

export default function AppHeader() {
  return (
    <header className="w-full bg-white border-b border-grey-border sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <SochIQLogo size="md" href="/app" />
          <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-yellow/20 text-charcoal border border-yellow/40">
            Analytics Workspace
          </span>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-grey-subtle border border-grey-border text-xs font-medium text-charcoal">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Memory-Only Zero Retention</span>
          </div>

          <Link
            href="/app/developer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-grey-border text-xs font-semibold text-charcoal hover:bg-grey-subtle transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Developer API</span>
          </Link>

          <Link
            href="/"
            className="text-xs font-medium text-grey-muted hover:text-charcoal px-2 py-1 transition-colors flex items-center gap-1"
            title="Return to Public Landing Page"
          >
            <span>Landing</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </header>
  );
}
