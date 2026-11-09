"use client";

import React from "react";
import Link from "next/link";
import { SochIQIcon } from "@/components/brand/SochIQLogo";
import {
  FileSpreadsheet,
  TrendingUp,
  ShieldCheck,
  LayoutDashboard,
  UploadCloud,
  Terminal,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

export default function DashboardPreview() {
  return (
    <section id="preview" className="w-full max-w-6xl mx-auto px-4 pb-16 pt-2">
      <div className="relative rounded-2xl sm:rounded-3xl bg-white border border-grey-border shadow-preview overflow-hidden">
        {/* Browser Mockup Top Window Bar */}
        <div className="bg-grey-subtle/80 border-b border-grey-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/40" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/40" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/40" />
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-4 py-1 rounded-md bg-white border border-grey-border text-[11px] font-mono text-grey-muted">
            <span className="text-emerald-600">https://</span>app.sochiq.ai/workspace
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow/20 text-charcoal border border-yellow/40">
              Live Preview
            </span>
          </div>
        </div>

        {/* Dashboard Workspace Simulation */}
        <div className="flex flex-col md:flex-row min-h-[520px] bg-background">
          {/* Mini Sidebar */}
          <div className="hidden md:flex flex-col w-56 bg-white border-r border-grey-border p-4 gap-6 shrink-0">
            <div className="flex items-center gap-2 px-2">
              <SochIQIcon size={24} />
              <span className="font-heading font-extrabold text-sm text-charcoal">
                Soch<span className="text-yellow">IQ</span>
              </span>
            </div>

            <nav className="flex flex-col gap-1 text-xs font-medium">
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-charcoal text-white font-semibold shadow-xs">
                <LayoutDashboard className="w-4 h-4 text-yellow" />
                <span>Dashboard</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-grey-muted hover:text-charcoal hover:bg-grey-subtle">
                <UploadCloud className="w-4 h-4" />
                <span>Upload & Ingest</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-grey-muted hover:text-charcoal hover:bg-grey-subtle">
                <Terminal className="w-4 h-4" />
                <span>Developer API</span>
              </div>
            </nav>

            <div className="mt-auto p-3 rounded-xl bg-grey-subtle border border-grey-border text-[11px]">
              <div className="flex items-center gap-1.5 text-charcoal font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Memory Only</span>
              </div>
              <p className="text-grey-muted text-[10px] leading-relaxed">
                Raw data is never persisted. Cleaned on session close.
              </p>
            </div>
          </div>

          {/* Main Dashboard Canvas */}
          <div className="flex-1 p-5 sm:p-7 flex flex-col gap-5 overflow-x-hidden">
            {/* Top Workspace Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-lg sm:text-xl font-bold text-charcoal">
                  Sales_Performance_Q4.csv
                </h3>
                <p className="text-xs text-grey-muted mt-0.5">
                  Evaluated in memory • Scoped to anonymous session
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  98% Clean
                </span>
                <Link
                  href="/app"
                  className="px-3 py-1.5 rounded-lg bg-charcoal text-white text-xs font-semibold hover:bg-charcoal-deep transition-all flex items-center gap-1"
                >
                  <span>Open Full Workspace</span>
                  <ArrowUpRight className="w-3 h-3 text-yellow" />
                </Link>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-white border border-grey-border shadow-xs">
                <span className="text-[11px] font-medium text-grey-muted uppercase tracking-wider">
                  Total Records
                </span>
                <div className="font-heading text-xl font-bold text-charcoal mt-1">
                  5,005
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">100% Validated</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-grey-border shadow-xs">
                <span className="text-[11px] font-medium text-grey-muted uppercase tracking-wider">
                  Dimensions
                </span>
                <div className="font-heading text-xl font-bold text-charcoal mt-1">
                  14 Columns
                </div>
                <span className="text-[10px] text-grey-muted">8 Numeric • 6 Categorical</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-grey-border shadow-xs">
                <span className="text-[11px] font-medium text-grey-muted uppercase tracking-wider">
                  Missing Cells
                </span>
                <div className="font-heading text-xl font-bold text-charcoal mt-1">
                  0 <span className="text-xs font-normal text-grey-muted">(0.0%)</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">Zero Null Gaps</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-grey-border shadow-xs">
                <span className="text-[11px] font-medium text-grey-muted uppercase tracking-wider">
                  Duplicate Rows
                </span>
                <div className="font-heading text-xl font-bold text-charcoal mt-1">
                  0
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">Deduplicated</span>
              </div>
            </div>

            {/* Visual Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Chart 1: Revenue Trend (Line) */}
              <div className="p-4 rounded-xl bg-white border border-grey-border shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-charcoal" />
                    <span className="text-xs font-bold text-charcoal uppercase tracking-wider">
                      Revenue Trend (Q1 - Q4)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-grey-muted">+24.8% YoY</span>
                </div>

                {/* SVG Line visualization with Yellow Accent */}
                <div className="h-36 w-full pt-2">
                  <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="yellowGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FFDF00" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#FFDF00" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,80 Q50,65 100,70 T200,35 T300,15 L300,100 L0,100 Z"
                      fill="url(#yellowGlow)"
                    />
                    <path
                      d="M0,80 Q50,65 100,70 T200,35 T300,15"
                      fill="none"
                      stroke="#111111"
                      strokeWidth="2.5"
                    />
                    <circle cx="100" cy="70" r="4" fill="#FFDF00" stroke="#111111" strokeWidth="2" />
                    <circle cx="200" cy="35" r="4" fill="#FFDF00" stroke="#111111" strokeWidth="2" />
                    <circle cx="300" cy="15" r="4.5" fill="#FFDF00" stroke="#111111" strokeWidth="2" />
                  </svg>
                </div>
                <div className="flex justify-between text-[10px] text-grey-muted pt-1 border-t border-grey-border">
                  <span>Jan</span>
                  <span>Apr</span>
                  <span>Jul</span>
                  <span>Oct</span>
                  <span>Dec</span>
                </div>
              </div>

              {/* Chart 2: Category Distribution (Bar) */}
              <div className="p-4 rounded-xl bg-white border border-grey-border shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-charcoal" />
                    <span className="text-xs font-bold text-charcoal uppercase tracking-wider">
                      Sales By Product Line
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-grey-muted">3 Categories</span>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-charcoal mb-1">
                      <span>Enterprise Software</span>
                      <span className="font-mono font-bold">$425,000</span>
                    </div>
                    <div className="w-full h-2.5 bg-grey-subtle rounded-full overflow-hidden">
                      <div className="h-full bg-charcoal rounded-full" style={{ width: "78%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-charcoal mb-1">
                      <span>Hardware & Peripherals</span>
                      <span className="font-mono font-bold">$215,000</span>
                    </div>
                    <div className="w-full h-2.5 bg-grey-subtle rounded-full overflow-hidden">
                      <div className="h-full bg-yellow rounded-full border border-yellow-hover" style={{ width: "45%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-charcoal mb-1">
                      <span>Consulting & Services</span>
                      <span className="font-mono font-bold">$160,000</span>
                    </div>
                    <div className="w-full h-2.5 bg-grey-subtle rounded-full overflow-hidden">
                      <div className="h-full bg-grey-muted rounded-full" style={{ width: "32%" }} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 text-[10px] text-grey-muted">
                  <span className="w-2 h-2 rounded-full bg-charcoal" />
                  <span>Primary</span>
                  <span className="w-2 h-2 rounded-full bg-yellow" />
                  <span>Growth</span>
                  <span className="w-2 h-2 rounded-full bg-grey-muted" />
                  <span>Stable</span>
                </div>
              </div>
            </div>

            {/* AI Insight Snippet in Dashboard */}
            <div className="p-3.5 rounded-xl bg-white border border-grey-border flex items-start gap-3 shadow-xs">
              <div className="w-7 h-7 rounded-lg bg-yellow/20 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-charcoal" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-charcoal">SochIQ Heuristic Finding: </span>
                <span className="text-grey-muted">
                  Strong revenue concentration detected in Enterprise Software (78% share), indicating high product dominance with 0 missing value penalties.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

