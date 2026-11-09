"use client";

import React from "react";
import { ShieldCheck, Cpu, HardDrive, Lock } from "lucide-react";

export default function PrivacySection() {
  const points = [
    {
      icon: Cpu,
      title: "Memory-Only Processing",
      desc: "Uploaded files are loaded in volatile server memory for computation and purged immediately.",
    },
    {
      icon: HardDrive,
      title: "No Permanent Raw Storage",
      desc: "Raw customer records are never written to disk or database tables in the MVP pipeline.",
    },
    {
      icon: Lock,
      title: "Secure Temporary Cloud Sessions",
      desc: "Browser profiles operate within an anonymous session with 30-minute inactivity expiration.",
    },
  ];

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-16 sm:py-20">
      <div className="rounded-3xl bg-charcoal text-white p-8 sm:p-12 relative overflow-hidden shadow-xl">
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-yellow/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-yellow text-xs font-semibold mb-4">
            <ShieldCheck className="w-4 h-4 text-yellow" />
            <span>Privacy-First Architecture</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Your data stays yours.
          </h2>
          <p className="text-sm text-grey-muted leading-relaxed">
            SochIQ processes uploaded datasets in temporary server memory. Original raw dataset records are not permanently stored.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/10">
          {points.map((pt, idx) => {
            const Icon = pt.icon;
            return (
              <div key={idx} className="flex flex-col gap-2">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-yellow mb-1">
                  <Icon className="w-4 h-4 text-yellow" />
                </div>
                <h3 className="font-heading text-sm font-bold text-white">
                  {pt.title}
                </h3>
                <p className="text-xs text-grey-muted leading-relaxed">
                  {pt.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
