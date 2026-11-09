"use client";

import React from "react";
import { Table, CheckCircle2, TrendingUp, Sparkles, AlertCircle } from "lucide-react";

export default function FeaturesSection() {
  return (
    <section id="features" className="w-full max-w-6xl mx-auto px-4 py-16 sm:py-24">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <span className="text-xs font-bold uppercase tracking-wider text-charcoal bg-yellow/25 px-3 py-1 rounded-full border border-yellow/40">
          Core Capabilities
        </span>
        <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-charcoal tracking-tight mt-4">
          Everything you need to understand your data.
        </h2>
        <p className="text-sm text-grey-muted mt-2.5">
          Streamlined from raw ingestion to executive presentation — built for precision and speed.
        </p>
      </div>

      {/* Exactly 3 Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Explore Your Data */}
        <div className="p-6 rounded-2xl bg-white border border-grey-border shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between group">
          <div>
            <div className="w-10 h-10 rounded-xl bg-charcoal text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Table className="w-5 h-5 text-yellow" />
            </div>
            <h3 className="font-heading text-lg font-bold text-charcoal mb-2">
              Explore Your Data
            </h3>
            <p className="text-xs text-grey-muted leading-relaxed mb-6">
              Upload your datasets and instantly understand their structure, records and columns.
            </p>
          </div>

          {/* Visual: Compact dataset preview table */}
          <div className="rounded-xl border border-grey-border bg-grey-subtle/50 p-2 text-[10px] overflow-hidden">
            <div className="grid grid-cols-3 font-mono font-bold text-charcoal pb-1.5 border-b border-grey-border px-1">
              <span>Customer</span>
              <span>Revenue</span>
              <span>Region</span>
            </div>
            <div className="space-y-1 pt-1.5 font-mono text-grey-muted px-1">
              <div className="grid grid-cols-3 truncate">
                <span className="text-charcoal font-medium">Acme Corp</span>
                <span className="text-emerald-700 font-semibold">$12,450</span>
                <span>North</span>
              </div>
              <div className="grid grid-cols-3 truncate">
                <span className="text-charcoal font-medium">Globex</span>
                <span className="text-emerald-700 font-semibold">$8,900</span>
                <span>West</span>
              </div>
              <div className="grid grid-cols-3 truncate">
                <span className="text-charcoal font-medium">Soylent</span>
                <span className="text-emerald-700 font-semibold">$15,200</span>
                <span>East</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Understand Data Quality */}
        <div className="p-6 rounded-2xl bg-white border border-grey-border shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between group">
          <div>
            <div className="w-10 h-10 rounded-xl bg-charcoal text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5 text-yellow" />
            </div>
            <h3 className="font-heading text-lg font-bold text-charcoal mb-2">
              Understand Data Quality
            </h3>
            <p className="text-xs text-grey-muted leading-relaxed mb-6">
              Detect missing values, duplicates and inconsistencies before they affect your analysis.
            </p>
          </div>

          {/* Visual: Minimal data quality score & hygiene badges */}
          <div className="rounded-xl border border-grey-border bg-grey-subtle/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-charcoal">Cleanliness Score</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                98.4%
              </span>
            </div>
            <div className="w-full h-2 bg-grey-border rounded-full overflow-hidden">
              <div className="h-full bg-charcoal rounded-full" style={{ width: "98.4%" }} />
            </div>
            <div className="flex items-center justify-between text-[10px] text-grey-muted pt-1">
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> 0 Missing
              </span>
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> 0 Duplicates
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Discover Insights */}
        <div className="p-6 rounded-2xl bg-white border border-grey-border shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between group">
          <div>
            <div className="w-10 h-10 rounded-xl bg-charcoal text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-yellow" />
            </div>
            <h3 className="font-heading text-lg font-bold text-charcoal mb-2">
              Discover Insights
            </h3>
            <p className="text-xs text-grey-muted leading-relaxed mb-6">
              Find patterns, visualize trends and ask AI-powered questions about your data.
            </p>
          </div>

          {/* Visual: Small chart / insight snippet */}
          <div className="rounded-xl border border-grey-border bg-grey-subtle/50 p-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-charcoal mb-2">
              <span>Dominant Trend</span>
              <span className="text-[10px] text-grey-muted">Automated</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-charcoal bg-white p-2 rounded-lg border border-grey-border">
              <TrendingUp className="w-4 h-4 text-charcoal shrink-0" />
              <span className="text-[11px] leading-tight text-grey-muted">
                Enterprise software revenue grew <b className="text-charcoal">+24%</b> with low variance.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

