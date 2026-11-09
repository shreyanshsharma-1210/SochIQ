"use client";

import React, { useState } from "react";
import { StructuredAIResponse, AIResponseType, AITableItem } from "@/types/ai";
import SafeMarkdown from "@/components/ui/SafeMarkdown";
import InsightMetricCard from "./InsightMetricCard";
import AIChartCard from "./AIChartCard";
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
    badgeClass: "bg-yellow/20 text-charcoal border-yellow/50",
  },
  overview: {
    label: "Dataset Overview",
    icon: Compass,
    badgeClass: "bg-grey-subtle text-charcoal border-grey-border",
  },
  analysis: {
    label: "Analytical Insight",
    icon: BarChart2,
    badgeClass: "bg-charcoal text-white border-charcoal",
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
    badgeClass: "bg-grey-subtle text-charcoal border-grey-border",
  },
  error: {
    label: "Notice",
    icon: HelpCircle,
    badgeClass: "bg-red-50 text-red-800 border-red-200",
  },
};

function TableCard({ tbl }: { tbl: AITableItem }) {
  return (
    <div className="rounded-xl border border-grey-border overflow-hidden bg-white shadow-2xs">
      <div className="px-3.5 py-2.5 bg-grey-subtle/80 border-b border-grey-border text-xs font-semibold text-charcoal flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TableIcon className="w-3.5 h-3.5 text-charcoal" />
          <span className="font-heading font-bold">{tbl.title || "Data Breakdown"}</span>
        </div>
        <span className="text-[10px] text-grey-muted font-mono">{tbl.rows.length} rows</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead>
            <tr className="bg-grey-subtle/40 border-b border-grey-border text-charcoal font-semibold text-[11px] uppercase tracking-wider">
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
                className="border-b last:border-0 border-grey-border/50 hover:bg-yellow/5 transition-colors"
              >
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 text-charcoal">
                    {cell !== null && cell !== undefined ? String(cell) : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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

  // Identify Key Takeaways sections vs general text sections
  const takeawaySections = (data.sections || []).filter(
    (s) =>
      s.type === "callout" ||
      /takeaway|finding|highlight|observation|key/i.test(s.title)
  );
  const otherSections = (data.sections || []).filter(
    (s) => !takeawaySections.includes(s)
  );

  const hasTables = Boolean(data.tables && data.tables.length > 0);
  const hasCharts = Boolean(data.charts && data.charts.length > 0);
  const hasBothTablesAndCharts = hasTables && hasCharts;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2.5 border-b border-grey-border">
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
          className="inline-flex items-center gap-1 text-[11px] font-medium text-grey-muted hover:text-charcoal transition-colors px-2 py-1 rounded-md hover:bg-grey-subtle border border-transparent hover:border-grey-border cursor-pointer"
          title="Copy response markdown"
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
        <div className="text-xs sm:text-sm leading-relaxed text-charcoal">
          <SafeMarkdown content={data.message} />
        </div>
      )}

      {/* Dedicated Key Takeaways Card (Section 3.D) */}
      {takeawaySections.length > 0 && (
        <div className="space-y-3">
          {takeawaySections.map((sec, idx) => (
            <div
              key={`takeaway-${idx}`}
              className="rounded-xl bg-yellow/10 border border-yellow/30 p-4 text-charcoal shadow-2xs"
            >
              <div className="flex items-center gap-2 mb-2 font-heading font-bold text-xs text-charcoal uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-charcoal fill-yellow" />
                <span>{sec.title || "Key Takeaways"}</span>
              </div>
              <div className="text-xs sm:text-sm text-charcoal leading-relaxed">
                <SafeMarkdown content={sec.content} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Structured metrics grid */}
      {data.metrics && data.metrics.length > 0 && (
        <div>
          <h5 className="text-[11px] font-semibold text-grey-muted uppercase tracking-wider mb-2">
            Key Metrics
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {data.metrics.map((m, idx) => (
              <InsightMetricCard key={idx} metric={m} />
            ))}
          </div>
        </div>
      )}

      {/* Analytical Response Cards: 2-column layout on wide screens if both tables & charts exist (Section 3.C) */}
      {hasBothTablesAndCharts ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start pt-1">
          <div className="space-y-3">
            <h5 className="text-[11px] font-semibold text-grey-muted uppercase tracking-wider">
              Data Breakdown
            </h5>
            {data.tables!.map((tbl, idx) => (
              <TableCard key={idx} tbl={tbl} />
            ))}
          </div>
          <div className="space-y-3">
            <h5 className="text-[11px] font-semibold text-grey-muted uppercase tracking-wider">
              Visualization
            </h5>
            {data.charts!.map((c, idx) => (
              <AIChartCard key={idx} chart={c} />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Structured tables (standalone) */}
          {hasTables && (
            <div className="space-y-3 pt-1">
              {data.tables!.map((tbl, idx) => (
                <TableCard key={idx} tbl={tbl} />
              ))}
            </div>
          )}

          {/* Structured charts (standalone) */}
          {hasCharts && (
            <div className="space-y-3 pt-1">
              {data.charts!.map((c, idx) => (
                <AIChartCard key={idx} chart={c} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Other structured sections (e.g., text, list) */}
      {otherSections.length > 0 && (
        <div className="space-y-3 pt-1">
          {otherSections.map((section, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-grey-border bg-grey-subtle/50"
            >
              <h5 className="font-heading text-xs font-bold text-charcoal mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-charcoal" />
                {section.title}
              </h5>
              <div className="text-xs sm:text-sm text-charcoal leading-relaxed">
                <SafeMarkdown content={section.content} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
