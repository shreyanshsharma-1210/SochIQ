"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-16 sm:py-20 text-center">
      <div className="p-10 sm:p-14 rounded-3xl bg-white border border-grey-border shadow-card flex flex-col items-center">
        <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-charcoal tracking-tight max-w-xl leading-tight mb-4">
          Your data has a story. <br />
          <span className="italic font-normal">Let's discover it.</span>
        </h2>
        <p className="text-sm text-grey-muted max-w-md mb-8">
          Upload any CSV, Excel or JSON table. Zero account setup required.
        </p>

        <Link
          href="/app"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-charcoal text-white text-sm font-semibold hover:bg-charcoal-deep transition-all shadow-card hover:shadow-card-hover group"
        >
          <span>Start Analyzing</span>
          <ArrowRight className="w-4 h-4 text-yellow group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
}
