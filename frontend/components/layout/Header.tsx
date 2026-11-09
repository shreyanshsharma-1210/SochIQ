"use client";

import Link from "next/link";
import { Sparkles, Terminal, ShieldCheck } from "lucide-react";

export default function Header() {
  return (
    <header className="w-full bg-surface/90 backdrop-blur-md border-b border-border sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-gold flex items-center justify-center text-white shadow-diwali group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-amber-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-bold text-text tracking-tight">DataLens</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full diwali-badge-gold">
                Cloud 2.0
              </span>
            </div>
            <p className="text-[11px] text-text-muted hidden sm:block">Upload your data. Understand it. Discover what matters.</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-light border border-border text-[12px] font-medium text-primary">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Memory-Only Zero Retention</span>
          </div>

          <Link
            href="/developer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border text-sm font-medium text-text-muted hover:text-text hover:bg-surface/60 transition-colors"
          >
            <Terminal className="w-4 h-4 text-gold" />
            <span>Developer API</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

