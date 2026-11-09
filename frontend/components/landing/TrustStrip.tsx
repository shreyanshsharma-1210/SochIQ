"use client";

import React from "react";
import { FileCode, Sparkles, ShieldCheck } from "lucide-react";

export default function TrustStrip() {
  const points = [
    {
      icon: FileCode,
      text: "CSV, Excel & JSON Support",
    },
    {
      icon: Sparkles,
      text: "AI-Powered Insights",
    },
    {
      icon: ShieldCheck,
      text: "Privacy-First Processing",
    },
  ];

  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="py-4 px-6 rounded-2xl bg-white border border-grey-border shadow-xs flex flex-col sm:flex-row items-center justify-around gap-4 text-center sm:text-left">
        {points.map((pt, idx) => {
          const Icon = pt.icon;
          return (
            <div key={idx} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-yellow/20 flex items-center justify-center text-charcoal shrink-0">
                <Icon className="w-4 h-4 text-charcoal" />
              </div>
              <span className="text-xs font-semibold text-charcoal tracking-tight">
                {pt.text}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

