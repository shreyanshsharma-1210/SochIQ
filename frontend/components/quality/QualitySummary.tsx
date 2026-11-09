"use client";

import { QualityMetrics } from "@/types";
import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

interface QualitySummaryProps {
  quality: QualityMetrics;
}

export default function QualitySummary({ quality }: QualitySummaryProps) {
  const scoreColor =
    quality.cleanliness_score >= 85
      ? "text-emerald-800 bg-emerald-50 border-emerald-200"
      : quality.cleanliness_score >= 65
      ? "text-amber-800 bg-amber-50 border-amber-200"
      : "text-red-800 bg-red-50 border-red-200";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sochiq-card p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-grey-muted">
            Cleanliness Score
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-heading text-3xl font-bold text-charcoal">
              {quality.cleanliness_score}%
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${scoreColor}`}>
              {quality.cleanliness_score >= 85 ? "High Quality" : "Needs Review"}
            </span>
          </div>
          <p className="text-[11px] text-grey-muted mt-2">Penalizes missing cells and duplicate records</p>
        </div>

        <div className="sochiq-card p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-grey-muted">
            Missing Values
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-heading text-3xl font-bold text-charcoal">
              {quality.missing_cells.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-grey-muted">({quality.missing_percentage}%)</span>
          </div>
          <p className="text-[11px] text-grey-muted mt-2">Total blank or null cells detected</p>
        </div>

        <div className="sochiq-card p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-grey-muted">
            Duplicate Records
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-heading text-3xl font-bold text-charcoal">
              {quality.duplicate_rows.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-grey-muted">({quality.duplicate_percentage}%)</span>
          </div>
          <p className="text-[11px] text-grey-muted mt-2">Identical rows across all dimensions</p>
        </div>

        <div className="sochiq-card p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-grey-muted">
            Empty Columns
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-heading text-3xl font-bold text-charcoal">
              {quality.empty_columns}
            </span>
            <span className="text-xs font-mono text-grey-muted">of {quality.total_columns}</span>
          </div>
          <p className="text-[11px] text-grey-muted mt-2">Columns with 100% missing values</p>
        </div>
      </div>

      {/* Column Breakdown Audit Table */}
      <div className="sochiq-card overflow-hidden">
        <div className="px-5 py-4 border-b border-grey-border bg-white flex items-center justify-between">
          <h3 className="font-heading text-sm font-bold text-charcoal">
            Column-by-Column Hygiene Audit
          </h3>
          <span className="text-xs font-mono text-grey-muted">
            {quality.column_audits.length} columns inspected
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-grey-subtle text-grey-muted font-semibold uppercase tracking-wider border-b border-grey-border">
              <tr>
                <th className="px-5 py-3">Column Name</th>
                <th className="px-5 py-3">Inferred Type</th>
                <th className="px-5 py-3">Missing Cells</th>
                <th className="px-5 py-3">Unique Values</th>
                <th className="px-5 py-3">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-border">
              {quality.column_audits.map((col) => (
                <tr key={col.name} className="hover:bg-grey-subtle/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-charcoal">{col.name}</td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider bg-grey-subtle text-charcoal border border-grey-border">
                      {col.inferred_type}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-charcoal">
                    {col.missing_count.toLocaleString()}{" "}
                    <span className="text-xs text-grey-muted">({col.missing_percentage}%)</span>
                  </td>
                  <td className="px-5 py-3 font-mono text-charcoal">
                    {col.unique_count.toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    {col.is_empty ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200 flex items-center gap-1 w-max">
                        <AlertCircle className="w-3.5 h-3.5" /> 100% Empty
                      </span>
                    ) : col.missing_percentage > 20 ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 w-max">
                        <AlertTriangle className="w-3.5 h-3.5" /> High Nulls
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-max">
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
