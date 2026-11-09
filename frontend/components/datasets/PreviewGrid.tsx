"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PreviewGridProps {
  columns: string[];
  inferredTypes: Record<string, string>;
  rows: Record<string, any>[];
  totalRows: number;
}

export default function PreviewGrid({ columns, inferredTypes, rows, totalRows }: PreviewGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(rows.length / pageSize);

  const paginatedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="sochiq-card overflow-hidden">
      <div className="px-5 py-4 border-b border-grey-border bg-white flex items-center justify-between">
        <div>
          <h3 className="font-heading text-sm font-bold text-charcoal">Dataset In-Memory Preview</h3>
          <p className="text-xs text-grey-muted">
            Showing first {rows.length} rows of {totalRows.toLocaleString()} total records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-grey-border hover:bg-grey-subtle disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-charcoal" />
          </button>
          <span className="text-xs font-mono text-grey-muted">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 rounded-lg border border-grey-border hover:bg-grey-subtle disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-charcoal" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-grey-subtle text-grey-muted font-semibold uppercase tracking-wider border-b border-grey-border">
            <tr>
              <th className="px-4 py-3 text-center w-12 text-grey-muted/60">#</th>
              {columns.map((col) => (
                <th key={col} className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-charcoal">{col}</span>
                    <span className="text-[10px] font-mono text-grey-muted lowercase font-normal">
                      {inferredTypes[col] || "string"}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-grey-border">
            {paginatedRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-grey-subtle/50 transition-colors">
                <td className="px-4 py-2.5 text-center text-xs text-grey-muted/70 font-mono">
                  {(currentPage - 1) * pageSize + idx + 1}
                </td>
                {columns.map((col) => {
                  const val = row[col];
                  return (
                    <td key={col} className="px-4 py-2.5 text-xs text-charcoal">
                      {val === null || val === undefined ? (
                        <span className="text-grey-muted/60 italic text-[11px]">null</span>
                      ) : typeof val === "boolean" ? (
                        <span className="font-semibold text-charcoal">{String(val)}</span>
                      ) : (
                        String(val)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
