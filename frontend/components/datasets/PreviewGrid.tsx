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
    <div className="diwali-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-surface flex items-center justify-between">
        <div>
          <h3 className="font-serif text-base font-bold text-text">Dataset In-Memory Preview</h3>
          <p className="text-xs text-text-muted">
            Showing first {rows.length} rows of {totalRows.toLocaleString()} total records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-border hover:bg-surface disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4 text-text" />
          </button>
          <span className="text-xs text-text-muted">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 rounded-lg border border-border hover:bg-surface disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4 text-text" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-primary-light/40 text-text-muted text-xs uppercase tracking-wider border-b border-border">
            <tr>
              <th className="px-4 py-3 text-center w-12 text-text-muted/60">#</th>
              {columns.map((col) => (
                <th key={col} className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-text">{col}</span>
                    <span className="text-[10px] text-primary lowercase">{inferredTypes[col] || "string"}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-surface/60 transition-colors">
                <td className="px-4 py-2.5 text-center text-xs text-text-muted/70">
                  {(currentPage - 1) * pageSize + idx + 1}
                </td>
                {columns.map((col) => {
                  const val = row[col];
                  return (
                    <td key={col} className="px-4 py-2.5 text-xs text-text">
                      {val === null || val === undefined ? (
                        <span className="text-text-muted italic text-[11px]">null</span>
                      ) : typeof val === "boolean" ? (
                        <span className="font-semibold text-primary">{String(val)}</span>
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

