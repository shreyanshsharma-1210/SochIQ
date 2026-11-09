"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  Trash2,
  UploadCloud,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  History,
  FolderOpen,
  Download,
  Calendar,
  Sparkles
} from "lucide-react";
import { useDatasetSession } from "@/context/DatasetSessionContext";
import { api } from "@/lib/apiClient";

export default function MyAnalysesPage() {
  const router = useRouter();
  const {
    datasets,
    analysisHistory,
    selectDataset,
    deleteDatasetFromCloud,
    reopenAnalysisRun,
    isLoadingWorkspace
  } = useDatasetSession();

  const [activeTab, setActiveTab] = useState<"datasets" | "history">("datasets");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleOpenDataset = async (datasetId: string) => {
    await selectDataset(datasetId);
    router.push("/app/upload");
  };

  const handleReopenAnalysis = async (analysisId: string) => {
    await reopenAnalysisRun(analysisId);
    router.push("/app/upload");
  };

  const handleDownloadFile = async (datasetId: string, filename: string) => {
    try {
      const blob = await api.downloadDatasetFile(datasetId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      alert(e.message || "Could not download file from storage.");
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
            Workspace Library
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">
            My Analyses
          </h1>
          <p className="text-xs sm:text-sm text-grey-muted mt-1">
            Access your cloud-persisted datasets, original files, and past analytical runs.
          </p>
        </div>

        <Link
          href="/app/upload"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-charcoal text-white text-xs font-semibold hover:bg-black transition-all shadow-xs self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4 text-yellow" />
          <span>Upload Dataset</span>
        </Link>
      </div>

      {/* Temporary Cloud Storage Notice */}
      <div className="p-4 rounded-2xl bg-grey-subtle border border-grey-border flex items-start gap-3">
        <Info className="w-4 h-4 text-charcoal shrink-0 mt-0.5" />
        <div className="text-xs text-grey-muted leading-relaxed">
          <span className="font-bold text-charcoal">Temporary Cloud Persistence:</span> Original files and computed analyses are preserved in private encrypted cloud storage and remain available throughout your active browser session.
        </div>
      </div>

      {/* View Switcher Tabs (Datasets vs Analysis History) */}
      <div className="flex items-center gap-2 border-b border-grey-border pb-2">
        <button
          onClick={() => setActiveTab("datasets")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "datasets"
              ? "bg-charcoal text-white shadow-xs"
              : "text-grey-muted hover:text-charcoal hover:bg-grey-subtle"
          }`}
        >
          <Layers className={`w-3.5 h-3.5 ${activeTab === "datasets" ? "text-yellow" : ""}`} />
          <span>Datasets ({datasets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "history"
              ? "bg-charcoal text-white shadow-xs"
              : "text-grey-muted hover:text-charcoal hover:bg-grey-subtle"
          }`}
        >
          <History className={`w-3.5 h-3.5 ${activeTab === "history" ? "text-yellow" : ""}`} />
          <span>Analysis History ({analysisHistory.length})</span>
        </button>
      </div>

      {/* View 1: Datasets Library */}
      {activeTab === "datasets" && (
        <>
          {isLoadingWorkspace ? (
            <div className="sochiq-card p-12 text-center text-xs text-grey-muted">
              Loading workspace datasets...
            </div>
          ) : datasets.length === 0 ? (
            <div className="sochiq-card p-14 text-center flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-grey-subtle flex items-center justify-center text-grey-muted">
                <Layers className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-charcoal text-base">
                  No datasets in workspace yet
                </h3>
                <p className="text-xs text-grey-muted mt-1 max-w-sm">
                  Upload datasets to start profiling. All workbooks uploaded during your session stay available here.
                </p>
              </div>
              <Link
                href="/app/upload"
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-charcoal text-white text-xs font-semibold hover:bg-black"
              >
                <UploadCloud className="w-4 h-4 text-yellow" />
                <span>Upload First Dataset</span>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {datasets.map((ds) => {
                const isExpanded = expandedId === ds.id;
                const columns = Array.isArray(ds.column_summary)
                  ? ds.column_summary
                  : ds.column_summary?.columns || [];

                return (
                  <div
                    key={ds.id}
                    className="sochiq-card bg-white border border-grey-border overflow-hidden transition-all"
                  >
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-grey-subtle flex items-center justify-center text-charcoal shrink-0">
                          <FileSpreadsheet className="w-5 h-5 text-charcoal" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-heading font-bold text-sm text-charcoal">
                              {ds.name}
                            </h3>
                            <span className="sochiq-badge-neutral uppercase text-[10px]">
                              {ds.file_format}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                              Cloud Persisted
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-grey-muted mt-1.5 flex-wrap">
                            <span>
                              <strong>{ds.row_count?.toLocaleString()}</strong> rows
                            </span>
                            <span>•</span>
                            <span>
                              <strong>{ds.column_count}</strong> columns
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(ds.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleOpenDataset(ds.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-charcoal text-white text-xs font-semibold hover:bg-black transition-all"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-yellow" />
                          <span>Open</span>
                        </button>
                        <button
                          onClick={() => handleDownloadFile(ds.id, ds.original_filename)}
                          className="p-2 text-grey-muted hover:text-charcoal border border-grey-border rounded-xl hover:bg-grey-subtle transition-colors"
                          title="Download original file from cloud storage"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleExpand(ds.id)}
                          className="p-2 text-grey-muted hover:text-charcoal border border-grey-border rounded-xl hover:bg-grey-subtle transition-colors"
                          title="Inspect schema audit"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${ds.name}" and remove from cloud storage?`)) {
                              deleteDatasetFromCloud(ds.id);
                            }
                          }}
                          className="p-2 text-grey-muted hover:text-red-600 border border-grey-border rounded-xl hover:bg-red-50 transition-colors"
                          title="Delete dataset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Schema Inspection */}
                    {isExpanded && (
                      <div className="border-t border-grey-border bg-grey-subtle/40 p-5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal mb-3">
                          Schema &amp; Quality Audit ({columns.length} columns)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {columns.map((col: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-lg bg-white border border-grey-border text-xs flex flex-col justify-between"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-semibold text-charcoal truncate" title={col.name}>
                                  {col.name}
                                </span>
                                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-grey-subtle text-grey-muted">
                                  {col.inferred_type}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-grey-muted mt-2">
                                <span>{col.missing_count || 0} missing</span>
                                <span>{col.unique_count || 0} unique</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* View 2: Analysis History */}
      {activeTab === "history" && (
        <>
          {analysisHistory.length === 0 ? (
            <div className="sochiq-card p-14 text-center flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-grey-subtle flex items-center justify-center text-grey-muted">
                <History className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-charcoal text-base">
                  No analysis runs recorded yet
                </h3>
                <p className="text-xs text-grey-muted mt-1 max-w-sm">
                  When you upload or analyze datasets, each execution run is logged here so you can revisit past findings.
                </p>
              </div>
            </div>
          ) : (
            <div className="sochiq-card bg-white border border-grey-border divide-y divide-grey-border">
              {analysisHistory.map((run) => (
                <div
                  key={run.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-grey-subtle/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-yellow/20 flex items-center justify-center text-charcoal shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 text-charcoal" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-xs text-charcoal capitalize">
                          {run.analysis_type.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-grey-muted">
                          ID: {run.id.slice(0, 8)}...
                        </span>
                      </div>
                      <p className="text-[11px] text-grey-muted mt-0.5">
                        Recorded at {new Date(run.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleReopenAnalysis(run.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-charcoal text-white text-xs font-semibold hover:bg-black transition-all self-end sm:self-auto"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-yellow" />
                    <span>Reopen Analysis</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
