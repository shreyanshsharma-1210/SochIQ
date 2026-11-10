"use client";

import { RuleInsight } from "@/types";
import {
  AlertTriangle,
  Info,
  Award,
  SlidersHorizontal,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface RuleInsightsDeckProps {
  insights: RuleInsight[];
}

export default function RuleInsightsDeck({ insights }: RuleInsightsDeckProps) {
  const getIcon = (severity: string) => {
    switch (severity) {
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case "success":
        return <Award className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-charcoal" />;
    }
  };

  const getBorder = (severity: string) => {
    switch (severity) {
      case "warning":
        return "border-amber-200 bg-amber-50/40";
      case "success":
        return "border-emerald-200 bg-emerald-50/40";
      default:
        return "border-grey-border bg-white";
    }
  };

  return (
    <div className="w-full h-[720px] max-h-[85vh] bg-white border border-grey-border rounded-2xl shadow-card flex flex-col overflow-hidden">
      {/* Pinned Header */}
      <div className="bg-charcoal text-white rounded-t-2xl px-5 sm:px-6 py-4 flex items-center justify-between shrink-0 shadow-sm border-b border-charcoal-deep">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-charcoal-deep border border-yellow/40 flex items-center justify-center shrink-0 shadow-inner">
            <SlidersHorizontal className="w-5 h-5 text-yellow" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-heading text-base sm:text-lg font-bold text-white tracking-tight truncate">
                Deterministic Observations
              </h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-yellow text-charcoal shadow-2xs shrink-0">
                Non-AI Engine
              </span>
            </div>
            <p className="text-xs text-white/70 mt-0.5 truncate leading-normal">
              Deterministic statistical rules and distribution observations.
            </p>
          </div>
        </div>

        <div className="shrink-0 ml-2">
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-white/10 text-white/90 border border-white/10">
            {insights?.length || 0} findings
          </span>
        </div>
      </div>

      {/* Scrollable Observation Cards (scrollable in length) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-[#FAFAFA]">
        {!insights || insights.length === 0 ? (
          <div className="min-h-full flex flex-col justify-center items-center text-center p-6 text-grey-muted">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
            <p className="text-xs sm:text-sm font-medium text-charcoal">
              No Rule Anomalies Triggered
            </p>
            <p className="text-xs text-grey-muted mt-1 max-w-xs">
              All statistical distributions fall within normal expected bounds.
            </p>
          </div>
        ) : (
          insights.map((item) => (
            <div
              key={item.id}
              className={`sochiq-card p-4 border flex items-start gap-3.5 transition-all hover:shadow-sm ${getBorder(
                item.severity
              )}`}
            >
              <div className="p-2 rounded-xl bg-white border border-grey-border shrink-0 shadow-2xs">
                {getIcon(item.severity)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-charcoal truncate">{item.title}</h4>
                  {item.metric && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-yellow/20 text-charcoal border border-yellow/40 shrink-0">
                      {item.metric}
                    </span>
                  )}
                </div>
                <p className="text-xs text-grey-muted mt-1 leading-relaxed">{item.description}</p>
                {item.category && (
                  <span className="inline-block mt-2 text-[9px] uppercase tracking-wider font-semibold text-grey-muted/80 bg-white/70 px-1.5 py-0.5 rounded border border-grey-border/60">
                    {item.category}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pinned Bottom Status Bar */}
      <div className="shrink-0 bg-white border-t border-grey-border px-4 py-3 rounded-b-2xl flex items-center justify-between text-[11px] text-grey-muted">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Deterministic heuristics • 100% reproducible</span>
        </span>
        <span className="hidden sm:inline-block font-mono text-[10px] text-grey-muted/80 shrink-0">
          Zero Hallucination
        </span>
      </div>
    </div>
  );
}
