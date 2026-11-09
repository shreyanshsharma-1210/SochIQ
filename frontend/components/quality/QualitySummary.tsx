"use client";

import { QualityMetrics } from "@/types";
import { CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from "lucide-react";

interface QualitySummaryProps {
  quality: QualityMetrics;
}

export default function QualitySummary({ quality }: QualitySummaryProps) {
  const scoreColor =
    quality.cleanliness_score >= 85
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : quality.cleanliness_score >= 65
      ? "text-amber-700 bg-amber-50 border-amber-200"
      : "text-maroon bg-maroon-light border-maroon";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="diwali-card p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Cleanliness Score</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-serif text-3xl font-bold text-text">{quality.cleanliness_score}%</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${scoreColor}`}>
              {quality.cleanliness_score >= 85 ? "High Quality" : "Needs Review"}
            </span>
          </div>
          <p className="text-[11px] text-text-muted mt-2">Penalizes missing cells and duplicate records</p>
        </div>

        <div className="diwali-card p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Missing Values</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-serif text-3xl font-bold text-text">{quality.missing_cells.toLocaleString()}</span>
            <span className="text-xs text-text-muted">({quality.missing_percentage}%)</span>
          </div>
          <p className="text-[11px] text-text-muted mt-2">Total blank or null cells detected</p>
        </div>

        <div className="diwali-card p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Duplicate Records</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-serif text-3xl font-bold text-text">{quality.duplicate_rows.toLocaleString()}</span>
            <span className="text-xs text-text-muted">({quality.duplicate_percentage}%)</span>
          </div>
          <p className="text-[11px] text-text-muted mt-2">Identical rows across all dimensions</p>
        </div>

        <div className="diwali-card p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Empty Columns</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-serif text-3xl font-bold text-text">{quality.empty_columns}</span>
            <span className="text-xs text-text-muted">of {quality.total_columns}</span>
          </div>
          <p className="text-[11px] text-text-muted mt-2">Columns with 100% missing values</p>
        </div>
      </div>

      {/* Column Breakdown Audit Table */}
      <div className="diwali-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-surface flex items-center justify-between">
          <h3 className="font-serif text-base font-bold text-text">Column-by-Column Hygiene Audit</h3>
          <span className="text-xs text-text-muted">{quality.column_audits.length} columns inspected</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-primary-light/40 text-text-muted text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-5 py-3">Column Name</th>
                <th className="px-5 py-3">Inferred Type</th>
                <th className="px-5 py-3">Missing Cells</th>
                <th className="px-5 py-3">Unique Values</th>
                <th className="px-5 py-3">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quality.column_audits.map((col) => (
                <tr key={col.name} className="hover:bg-surface/60 transition-colors">
                  <td className="px-5 py-3 font-medium text-text">{col.name}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded diwali-badge-gold uppercase tracking-wider font-semibold">
                      {col.inferred_type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-text">
                    {col.missing_count.toLocaleString()}{" "}
                    <span className="text-xs text-text-muted">({col.missing_percentage}%)</span>
                  </td>
                  <td className="px-5 py-3 text-text">{col.unique_count.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    {col.is_empty ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded diwali-badge-maroon flex items-center gap-1 w-max">
                        <AlertCircle className="w-3.5 h-3.5" /> 100% Empty
                      </span>
                    ) : col.missing_percentage > 20 ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded diwali-badge-saffron flex items-center gap-1 w-max">
                        <AlertTriangle className="w-3.5 h-3.5" /> High Nulls
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-max">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

