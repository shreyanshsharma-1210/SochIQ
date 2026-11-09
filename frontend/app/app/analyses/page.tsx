"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Trash2,
  UploadCloud,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar,
  ShieldAlert,
} from "lucide-react";
import { api } from "@/lib/apiClient";
import { DatasetMetadata } from "@/types";

export default function MyAnalysesPage() {
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadSaved();
  }, []);

  const loadSaved = async () => {
    try {
      const data = await api.getSavedDatasets();
      setDatasets(data);
    } catch (e) {
      console.warn("Failed to load saved metadata:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete the saved metadata profile for "${name}"?`)) {
      await api.deleteSavedDataset(id);
      loadSaved();
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-grey-muted">
            Saved Profiles
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">
            My Analyses
          </h1>
          <p className="text-xs sm:text-sm text-grey-muted mt-1">
            Structural column schemas and statistical summaries saved in your session.
          </p>
        </div>

        <Link
          href="/app/upload"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-charcoal text-white text-xs font-semibold hover:bg-charcoal-deep transition-all shadow-xs self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4 text-yellow" />
          <span>New Analysis</span>
        </Link>
      </div>

      {/* Memory-Only Privacy Notice */}
      <div className="p-4 rounded-2xl bg-grey-subtle border border-grey-border flex items-start gap-3">
        <Info className="w-4 h-4 text-charcoal shrink-0 mt-0.5" />
        <div className="text-xs text-grey-muted leading-relaxed">
          <span className="font-bold text-charcoal">Memory-Only Privacy Notice:</span> Saved profiles only store structural column summaries and data hygiene audits. Original raw dataset files are never persisted on the server or cloud and must be uploaded again to run fresh analytical computations.
        </div>
      </div>

      {/* Datasets Listing */}
      {isLoading ? (
        <div className="sochiq-card p-12 text-center text-xs text-grey-muted">
          Loading saved analysis profiles...
        </div>
      ) : datasets.length === 0 ? (
        <div className="sochiq-card p-14 text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-grey-subtle flex items-center justify-center text-grey-muted">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-charcoal text-base">
              No saved metadata profiles yet
            </h3>
            <p className="text-xs text-grey-muted mt-1 max-w-sm">
              When you evaluate a dataset in the workspace, click "Save Metadata" to bookmark its schema and column audits here.
            </p>
          </div>
          <Link
            href="/app/upload"
            className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-charcoal text-white text-xs font-semibold hover:bg-charcoal-deep transition-all shadow-xs"
          >
            <UploadCloud className="w-4 h-4 text-yellow" />
            <span>Upload a Dataset Now</span>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {datasets.map((ds) => {
            const isExpanded = expandedId === ds.id;
            return (
              <div
                key={ds.id}
                className="sochiq-card p-5 bg-white border border-grey-border transition-all flex flex-col gap-4"
              >
                {/* Summary Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-yellow/20 flex items-center justify-center text-charcoal shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold text-sm text-charcoal">{ds.name}</h3>
                        <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-grey-subtle text-charcoal border border-grey-border">
                          {ds.file_format}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-grey-muted mt-1 font-mono">
                        <span>{ds.row_count.toLocaleString()} rows</span>
                        <span>•</span>
                        <span>{ds.column_count} columns</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-grey-muted" />
                          <span>{new Date(ds.created_at).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => toggleExpand(ds.id)}
                      className="px-3 py-1.5 rounded-xl border border-grey-border bg-white text-xs font-semibold text-charcoal hover:bg-grey-subtle flex items-center gap-1.5 transition-colors"
                    >
                      <span>{isExpanded ? "Hide Details" : "Inspect Schema"}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleDelete(ds.id, ds.name)}
                      className="p-1.5 rounded-xl border border-grey-border text-grey-muted hover:text-red-700 hover:bg-red-50 transition-colors"
                      title="Delete profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Collapsible Column Summary */}
                {isExpanded && (
                  <div className="pt-3 border-t border-grey-border mt-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-grey-muted">
                        Saved Column Schema & Audits
                      </h4>
                      <Link
                        href="/app/upload"
                        className="text-xs font-semibold text-charcoal hover:underline flex items-center gap-1"
                      >
                        <span>Analyze this file again</span>
                        <UploadCloud className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {ds.column_summary && ds.column_summary.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-grey-border">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-grey-subtle text-grey-muted font-semibold uppercase tracking-wider border-b border-grey-border">
                            <tr>
                              <th className="px-4 py-2">Column</th>
                              <th className="px-4 py-2">Inferred Type</th>
                              <th className="px-4 py-2">Missing Cells</th>
                              <th className="px-4 py-2">Unique Count</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-grey-border">
                            {ds.column_summary.map((col: any, cIdx: number) => (
                              <tr key={cIdx} className="hover:bg-grey-subtle/40">
                                <td className="px-4 py-2 font-medium text-charcoal">{col.name}</td>
                                <td className="px-4 py-2 font-mono text-[11px] text-grey-muted">
                                  {col.inferred_type || "string"}
                                </td>
                                <td className="px-4 py-2 font-mono text-charcoal">
                                  {col.missing_count ?? 0}
                                </td>
                                <td className="px-4 py-2 font-mono text-charcoal">
                                  {col.unique_count ?? "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-grey-muted italic">
                        No individual column audits recorded for this profile.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

