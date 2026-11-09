"use client";

import { RuleInsight } from "@/types";
import { AlertTriangle, Info, Award } from "lucide-react";

interface RuleInsightsDeckProps {
  insights: RuleInsight[];
}

export default function RuleInsightsDeck({ insights }: RuleInsightsDeckProps) {
  if (!insights || insights.length === 0) {
    return null;
  }

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
        return "border-amber-200 bg-amber-50/30";
      case "success":
        return "border-emerald-200 bg-emerald-50/30";
      default:
        return "border-grey-border bg-white";
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-bold text-charcoal">
          Deterministic Heuristic Observations
        </h3>
        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-grey-subtle text-grey-muted border border-grey-border">
          Non-AI Heuristic Engine
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((item) => (
          <div
            key={item.id}
            className={`sochiq-card p-4 border flex items-start gap-3.5 ${getBorder(item.severity)}`}
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
