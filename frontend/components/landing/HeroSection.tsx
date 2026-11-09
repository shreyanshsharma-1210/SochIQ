"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Play } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-12 sm:pt-36 sm:pb-16 flex flex-col items-center text-center px-4 overflow-hidden">
      {/* Background dot grid pattern */}
      <div className="absolute inset-0 bg-dot-grid opacity-60 pointer-events-none -z-10" />

      {/* Radial soft fade */}
      <div className="absolute inset-0 bg-radial from-transparent via-background/80 to-background pointer-events-none -z-10" />

      {/* Announcement Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-grey-border shadow-xs text-xs font-medium text-charcoal mb-6 animate-fade-in">
        <span className="w-2 h-2 rounded-full bg-yellow animate-pulse" />
        <span className="font-semibold text-charcoal">Meet SochIQ</span>
        <span className="text-grey-muted">—</span>
        <span className="text-grey-muted">Your data, understood.</span>
      </div>

      {/* Main Headline */}
      <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl font-extrabold text-charcoal tracking-tight max-w-4xl leading-[1.08] mb-6">
        Turn Your Data <br />
        <span className="italic font-normal relative inline-block">
          <span className="relative z-10 px-2 py-0.5 rounded-md text-charcoal">
            Into Smarter Decisions.
          </span>
          <span className="absolute inset-x-0 bottom-1.5 h-4 sm:h-5 bg-yellow -z-0 rounded" />
        </span>
      </h1>

      {/* Supporting Copy */}
      <p className="text-base sm:text-lg text-grey-muted max-w-2xl leading-relaxed mb-8">
        Explore datasets, uncover patterns and turn raw information into meaningful insights — all in one intelligent workspace.
      </p>

      {/* Hero CTAs */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <Link
          href="/app"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-charcoal text-white text-sm font-semibold hover:bg-charcoal-deep transition-all shadow-card hover:shadow-card-hover group"
        >
          <span>Start Analyzing</span>
          <ArrowRight className="w-4 h-4 text-yellow group-hover:translate-x-1 transition-transform" />
        </Link>
        <a
          href="#preview"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white border border-grey-border text-charcoal text-sm font-medium hover:bg-grey-subtle transition-colors shadow-2xs"
        >
          <Play className="w-3.5 h-3.5 fill-charcoal text-charcoal" />
          <span>See How It Works</span>
        </a>
      </div>
    </section>
  );
}

