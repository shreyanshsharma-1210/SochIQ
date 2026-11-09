"use client";

import React from "react";
import { AIMetricItem } from "@/types/ai";
import { TrendingUp, Layers, CheckCircle2 } from "lucide-react";

interface InsightMetricCardProps {
  metric: AIMetricItem;
}

export default function InsightMetricCard({ metric }: InsightMetricCardProps) {
  return (
    <div className="p-3 rounded-xl bg-surface border border-border shadow-xs hover:border-gold/40 transition-colors">
      <div className="flex items-center justify-between text-xs text-text-muted mb-1">
        <span className="font-medium truncate">{metric.label}</span>
        <TrendingUp className="w-3.5 h-3.5 text-gold shrink-0" />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold font-serif text-text tracking-tight">
          {metric.value}
        </span>
        {metric.unit && (
          <span className="text-xs font-medium text-text-muted">{metric.unit}</span>
        )}
      </div>
      {metric.description && (
        <p className="text-[11px] text-text-muted mt-1 leading-tight truncate" title={metric.description}>
          {metric.description}
        </p>
      )}
    </div>
  );
}
