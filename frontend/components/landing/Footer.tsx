"use client";

import React from "react";
import Link from "next/link";
import SochIQLogo from "@/components/brand/SochIQLogo";

export default function Footer() {
  return (
    <footer className="w-full border-t border-grey-border bg-white py-12 px-4 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-grey-muted">
        {/* Brand & Tagline */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <SochIQLogo size="sm" href="/" />
          <span className="hidden sm:inline text-grey-border">|</span>
          <span className="text-grey-muted font-medium">Think smarter. See deeper.</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 font-medium">
          <a href="#features" className="hover:text-charcoal transition-colors">
            Features
          </a>
          <Link href="/app/developer" className="hover:text-charcoal transition-colors">
            Developer API
          </Link>
          <span className="text-grey-muted">Memory-Only Privacy</span>
        </div>

        {/* Copyright */}
        <div>
          © {new Date().getFullYear()} SochIQ. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
