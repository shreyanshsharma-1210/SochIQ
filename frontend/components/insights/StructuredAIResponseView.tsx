"use client";

import React, { useState } from "react";
import { StructuredAIResponse, AIResponseType } from "@/types/ai";
import SafeMarkdown from "@/components/ui/SafeMarkdown";
import InsightMetricCard from "./InsightMetricCard";
import AIChartCard from "./AIChartCard";
import SuggestionChip from "./SuggestionChip";
import {
  Sparkles,
  BarChart2,
  Table as TableIcon,
  HelpCircle,
  AlertTriangle,
  Compass,
  Check,
  Copy,
  Info,
  Scale,
  LineChart,
} from "lucide-react";

interface StructuredAIResponseViewProps {
  data: StructuredAIResponse;
  rawText?: string;
  onSelectSuggestion?: (prompt: string) => void;
  isLoading?: boolean;
}

const TYPE_CONFIG: Record<
  AIResponseType,
  { label: string; icon: React.ElementType; badgeClass: string }
> = {
  greeting: {
    label: "Welcome",
    icon: Sparkles,
    badgeClass: "bg-amber-100/70 text-primary border-amber-200",
  },
  overview: {
    label: "Dataset Overview",
    icon: Compass,
    badgeClass: "bg-amber-100/70 text-primary border-amber-200",
  },
  analysis: {
    label: "Analytical Insight",
    icon: BarChart2,
    badgeClass: "bg-gold/15 text-primary border-gold/30",
  },
  comparison: {
    label: "Comparison",
    icon: Scale,
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
  },
  data_quality: {
    label: "Data Quality Audit",
    icon: AlertTriangle,
    badgeClass: "bg-amber-50 text-amber-900 border-amber-300",
  },
  trend: {
    label: "Trend & Pattern",
    icon: LineChart,
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  explanation: {
    label: "Explanation",
    icon: Info,
    badgeClass: "bg-stone-100 text-stone-800 border-stone-200",
  },
  error: {
    label: "Notice",
    icon: HelpCircle,
    badgeClass: "bg-red-50 text-red-800 border-red-200",
  },
};

export default function StructuredAIResponseView({
  data,
  rawText,
  onSelectSuggestion,
  isLoading,
}: StructuredAIResponseViewProps) {
  const [copied, setCopied] = useState(false);

  const config = TYPE_CONFIG[data.response_type] || TYPE_CONFIG.explanation;
  const TypeIcon = config.icon;

  const handleCopy = () => {
    const textToCopy = rawText || data.raw_markdown || data.message;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${config.badgeClass}`}
          >
            <TypeIcon className="w-3 h-3 shrink-0" />
            <span>{config.label}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-surface border border-transparent hover:border-border"
          title="Copy markdown text"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-600" />
              <span className="text-emerald-700">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Main message */}
      {data.message && (
        <div className="text-sm leading-relaxed">
          <SafeMarkdown content={data.message} />
        </div>
      )}

      {/* Structured metrics grid */}
      {data.metrics && data.metrics.length > 0 && (
        <div>
          <h5 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
            Key Metrics
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {data.metrics.map((m, idx) => (
              <InsightMetricCard key={idx} metric={m} />
            ))}
          </div>
        </div>
      )}

      {/* Structured sections */}
      {data.sections && data.sections.length > 0 && (
        <div className="space-y-3 pt-1">
          {data.sections.map((section, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border ${
                section.type === "callout"
                  ? "bg-amber-50/50 border-amber-200/80"
                  : "bg-surface/60 border-border"
              }`}
            >
              <h5 className="font-serif text-xs font-bold text-text mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                {section.title}
              </h5>
              <SafeMarkdown content={section.content} />
            </div>
          ))}
        </div>
      )}

      {/* Structured tables */}
      {data.tables && data.tables.length > 0 && (
        <div className="space-y-3">
          {data.tables.map((tbl, idx) => (
            <div key={idx} className="my-2 rounded-xl border border-border overflow-hidden bg-surface">
              {tbl.title && (
                <div className="px-3 py-2 bg-stone-50 border-b border-border text-xs font-semibold text-text flex items-center gap-1.5">
                  <TableIcon className="w-3.5 h-3.5 text-gold" />
                  <span>{tbl.title}</span>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50/50 border-b border-border text-text font-semibold">
                      {tbl.headers.map((h, hIdx) => (
                        <th key={hIdx} className="px-3 py-2 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tbl.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="border-b last:border-0 border-border/40 hover:bg-stone-50/40 transition-colors"
                      >
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 text-text/90">
                            {cell !== null && cell !== undefined ? String(cell) : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Structured charts */}
      {data.charts && data.charts.length > 0 && (
        <div className="space-y-3">
          {data.charts.map((c, idx) => (
            <AIChartCard key={idx} chart={c} />
          ))}
        </div>
      )}

      {/* Follow-up suggestions */}
      {data.suggestions && data.suggestions.length > 0 && onSelectSuggestion && (
        <div className="pt-2">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
            Suggested Next Inquiries
          </p>
          <div className="flex flex-wrap gap-2">
            {data.suggestions.map((s, idx) => (
              <SuggestionChip
                key={idx}
                text={s}
                onClick={onSelectSuggestion}
                disabled={isLoading}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
