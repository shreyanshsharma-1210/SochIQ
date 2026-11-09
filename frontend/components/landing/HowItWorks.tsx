"use client";

import React from "react";
import { UploadCloud, BarChart3, Lightbulb } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      step: "01",
      icon: UploadCloud,
      title: "Upload",
      desc: "Bring your CSV, Excel or JSON file. Processed instantly in-memory with zero permanent server storage.",
    },
    {
      step: "02",
      icon: BarChart3,
      title: "Analyze",
      desc: "Explore automated data quality audits, descriptive statistics, and interactive distributions.",
    },
    {
      step: "03",
      icon: Lightbulb,
      title: "Discover",
      desc: "Find hidden patterns, ask natural AI queries, and export executive PDF reports.",
    },
  ];

  return (
    <section id="how-it-works" className="w-full max-w-6xl mx-auto px-4 py-16">
      <div className="text-center max-w-xl mx-auto mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-charcoal bg-yellow/25 px-3 py-1 rounded-full border border-yellow/40">
          Workflow
        </span>
        <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-charcoal tracking-tight mt-4">
          Three steps to intelligence.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {steps.map((st, idx) => {
          const Icon = st.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white border border-grey-border shadow-xs hover:border-grey-muted/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-grey-subtle border border-grey-border flex items-center justify-center text-charcoal">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-heading text-2xl font-extrabold text-grey-muted/30">
                    {st.step}
                  </span>
                </div>
                <h3 className="font-heading text-base font-bold text-charcoal mb-2">
                  {st.title}
                </h3>
                <p className="text-xs text-grey-muted leading-relaxed">
                  {st.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
