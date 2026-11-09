"use client";

import { RuleInsight } from "@/types";
import { AlertTriangle, Info, CheckCircle2, Award } from "lucide-react";

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
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "success":
        return <Award className="w-5 h-5 text-emerald-600" />;
      default:
        return <Info className="w-5 h-5 text-gold" />;
    }
  };

  const getBorder = (severity: string) => {
    switch (severity) {
      case "warning":
        return "border-amber-200 bg-amber-50/40";
      case "success":
        return "border-emerald-200 bg-emerald-50/40";
      default:
        return "border-border bg-surface";
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-base font-bold text-text">Deterministic Heuristic Observations</h3>
        <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded diwali-badge-gold">
          Non-AI Core Engine
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((item) => (
          <div key={item.id} className={`diwali-card p-4 border flex items-start gap-3.5 ${getBorder(item.severity)}`}>
            <div className="p-2 rounded-xl bg-white border border-border shrink-0 shadow-sm">
              {getIcon(item.severity)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-text">{item.title}</h4>
                {item.metric && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded diwali-badge-gold shrink-0">
                    {item.metric}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

