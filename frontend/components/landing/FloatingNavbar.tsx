"use client";

import React, { useState } from "react";
import Link from "next/link";
import SochIQLogo from "@/components/brand/SochIQLogo";
import { ArrowUpRight, Menu, X } from "lucide-react";

export default function FloatingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="w-full max-w-4xl bg-white/95 backdrop-blur-md border border-grey-border rounded-full px-5 py-2.5 shadow-pill flex items-center justify-between transition-all">
        {/* Left: Brand */}
        <SochIQLogo size="sm" href="/" />

        {/* Middle: Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-grey-muted">
          <a
            href="#features"
            className="hover:text-charcoal transition-colors cursor-pointer"
          >
            Features
          </a>
          <Link
            href="/app/developer"
            className="hover:text-charcoal transition-colors"
          >
            Developer API
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="#preview"
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-charcoal hover:bg-grey-subtle transition-colors"
          >
            See Demo
          </a>
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-charcoal text-white hover:bg-charcoal-deep transition-all shadow-xs group"
          >
            <span>Launch App</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-yellow group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1.5 rounded-lg text-charcoal hover:bg-grey-subtle"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-20 left-4 right-4 bg-white border border-grey-border rounded-2xl p-4 shadow-xl z-50 flex flex-col gap-3">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 text-sm font-medium text-charcoal hover:bg-grey-subtle rounded-xl"
          >
            Features
          </a>
          <Link
            href="/app/developer"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 text-sm font-medium text-charcoal hover:bg-grey-subtle rounded-xl"
          >
            Developer API
          </Link>
          <a
            href="#preview"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 text-sm font-medium text-charcoal hover:bg-grey-subtle rounded-xl"
          >
            See Demo
          </a>
          <Link
            href="/app"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full text-center py-2.5 rounded-xl bg-charcoal text-white text-sm font-semibold hover:bg-charcoal-deep"
          >
            Launch App →
          </Link>
        </div>
      )}
    </header>
  );
}

