"use client";

import React from "react";
import { AIMetricItem } from "@/types/ai";
import { TrendingUp } from "lucide-react";

interface InsightMetricCardProps {
  metric: AIMetricItem;
}

export default function InsightMetricCard({ metric }: InsightMetricCardProps) {
  return (
    <div className="p-3.5 rounded-xl bg-white border border-grey-border shadow-xs hover:border-grey-muted/50 transition-colors">
      <div className="flex items-center justify-between text-xs text-grey-muted mb-1">
        <span className="font-medium truncate">{metric.label}</span>
        <TrendingUp className="w-3.5 h-3.5 text-charcoal shrink-0" />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold font-heading text-charcoal tracking-tight">
          {metric.value}
        </span>
        {metric.unit && (
          <span className="text-xs font-medium text-grey-muted">{metric.unit}</span>
        )}
      </div>
      {metric.description && (
        <p className="text-[11px] text-grey-muted mt-1 leading-tight truncate" title={metric.description}>
          {metric.description}
        </p>
      )}
    </div>
  );
}
