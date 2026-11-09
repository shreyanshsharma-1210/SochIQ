"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Layers,
  Clock,
  History,
  FolderOpen
} from "lucide-react";
import UploadDropzone from "@/components/datasets/UploadDropzone";
import { useDatasetSession } from "@/context/DatasetSessionContext";

export default function OverviewDashboardPage() {
  const router = useRouter();
  const {
    datasets,
    analysisHistory,
    remainingSeconds,
    uploadDatasetToCloud,
    selectDataset,
    deleteDatasetFromCloud,
    reopenAnalysisRun,
    isLoadingWorkspace
  } = useDatasetSession();

  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  const handleProcessFile = async (file: File) => {
    setIsProcessingUpload(true);
    try {
      await uploadDatasetToCloud(file);
      router.push("/app/upload");
    } catch (err: any) {
      alert(err.message || "Failed to upload and analyze dataset.");
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const handleOpenDataset = async (datasetId: string) => {
    await selectDataset(datasetId);
    router.push("/app/upload");
  };

  const handleReopenAnalysis = async (analysisId: string) => {
    await reopenAnalysisRun(analysisId);
    router.push("/app/upload");
  };

  const totalRecords = datasets.reduce((acc, curr) => acc + (curr.row_count || 0), 0);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedCountdown = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-8">
      {/* 1, 2, 3: Workspace Heading & Primary Headline */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-grey-muted">
          Your workspace
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-charcoal tracking-tight">
          Make sense of your data.
        </h1>
        <p className="text-xs sm:text-sm text-grey-muted max-w-xl leading-relaxed">
          Upload any CSV, Excel or JSON table. Datasets are stored in temporary encrypted cloud storage and automatically purged after 30 minutes of workspace inactivity.
        </p>
      </div>

      {/* 4: Prominent Dataset Upload Area */}
      <div className="sochiq-card p-6 sm:p-8 bg-white border border-grey-border shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow" />
            <h2 className="font-heading text-sm font-bold text-charcoal uppercase tracking-wider">
              Upload &amp; Ingest Dataset
            </h2>
          </div>
          <span className="text-[11px] font-mono text-grey-muted">
            Max 25 MB • 30m Temporary Cloud Persistence
          </span>
        </div>

        <UploadDropzone onFileSelected={handleProcessFile} isLoading={isProcessingUpload} />
      </div>

      {/* 5: Three Compact Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sochiq-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-grey-muted">
            <span>Datasets in Workspace</span>
            <Layers className="w-4 h-4 text-charcoal" />
          </div>
          <div className="font-heading text-3xl font-bold text-charcoal mt-2">
            {datasets.length}
          </div>
          <p className="text-[11px] text-grey-muted mt-1">
            {datasets.length === 1 ? "1 active dataset ready" : `${datasets.length} active datasets stored`}
          </p>
        </div>

        <div className="sochiq-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-grey-muted">
            <span>Records Profiled</span>
            <FileSpreadsheet className="w-4 h-4 text-charcoal" />
          </div>
          <div className="font-heading text-3xl font-bold text-charcoal mt-2">
            {totalRecords.toLocaleString()}
          </div>
          <p className="text-[11px] text-grey-muted mt-1">Cumulative rows across datasets</p>
        </div>

        <div className="sochiq-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-grey-muted">
            <span>Session Inactivity</span>
            <Clock className="w-4 h-4 text-charcoal" />
          </div>
          <div className="font-heading text-3xl font-bold font-mono text-charcoal mt-2">
            {formattedCountdown}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Auto-purges after 30m idle</span>
          </div>
        </div>
      </div>

      {/* 6: Recent Datasets in Cloud Workspace */}
      <div className="sochiq-card bg-white border border-grey-border overflow-hidden">
        <div className="px-6 py-4 border-b border-grey-border flex items-center justify-between bg-grey-subtle/50">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-charcoal" />
            <h3 className="font-heading font-bold text-sm text-charcoal">
              Active Cloud Datasets
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-grey-border text-[11px] font-semibold text-charcoal">
              {datasets.length}
            </span>
          </div>
          {datasets.length > 0 && (
            <Link
              href="/app/analyses"
              className="text-xs font-semibold text-charcoal hover:underline flex items-center gap-1"
            >
              <span>View Library</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {isLoadingWorkspace ? (
          <div className="p-8 text-center text-xs text-grey-muted">Loading workspace datasets...</div>
        ) : datasets.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-yellow/20 flex items-center justify-center text-charcoal">
              <Layers className="w-5 h-5 text-charcoal" />
            </div>
            <p className="font-heading font-bold text-charcoal text-xs">No datasets uploaded yet</p>
            <p className="text-[11px] text-grey-muted max-w-sm">
              Upload a dataset above to start exploring. Files are saved in your temporary browser workspace and persist across reloads.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-grey-subtle/80 text-grey-muted font-semibold uppercase tracking-wider text-[10px] border-b border-grey-border">
                <tr>
                  <th className="px-6 py-3">Dataset Name</th>
                  <th className="px-6 py-3">Format</th>
                  <th className="px-6 py-3">Records</th>
                  <th className="px-6 py-3">Columns</th>
                  <th className="px-6 py-3">Uploaded</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-border">
                {datasets.map((ds) => (
                  <tr key={ds.id} className="hover:bg-grey-subtle/40 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-charcoal flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-grey-muted shrink-0" />
                      <span className="truncate max-w-[200px]" title={ds.original_filename}>
                        {ds.name}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="sochiq-badge-neutral uppercase text-[10px]">
                        {ds.file_format}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-grey-muted">
                      {ds.row_count?.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-grey-muted">
                      {ds.column_count}
                    </td>
                    <td className="px-6 py-3.5 text-grey-muted text-[11px]">
                      {new Date(ds.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-3.5 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenDataset(ds.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-charcoal text-white text-[11px] font-semibold hover:bg-black transition-all"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-yellow" />
                        <span>Open</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${ds.name}" and remove its file from cloud storage?`)) {
                            deleteDatasetFromCloud(ds.id);
                          }
                        }}
                        className="p-1.5 text-grey-muted hover:text-red-600 rounded-md transition-colors"
                        title="Delete dataset and cloud storage object"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 7: Recent Analysis Runs */}
      {analysisHistory.length > 0 && (
        <div className="sochiq-card bg-white border border-grey-border overflow-hidden">
          <div className="px-6 py-4 border-b border-grey-border flex items-center justify-between bg-grey-subtle/50">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-charcoal" />
              <h3 className="font-heading font-bold text-sm text-charcoal">
                Recent Analysis Runs
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-grey-border text-[11px] font-semibold text-charcoal">
                {analysisHistory.length}
              </span>
            </div>
          </div>
          <div className="divide-y divide-grey-border">
            {analysisHistory.slice(0, 5).map((run) => (
              <div
                key={run.id}
                className="px-6 py-3.5 flex items-center justify-between hover:bg-grey-subtle/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow" />
                  <div>
                    <span className="font-semibold text-xs text-charcoal capitalize">
                      {run.analysis_type.replace(/_/g, " ")}
                    </span>
                    <span className="text-[11px] text-grey-muted ml-2">
                      {new Date(run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleReopenAnalysis(run.id)}
                  className="text-xs font-semibold text-charcoal hover:underline flex items-center gap-1"
                >
                  <span>Reopen</span>
                  <ArrowRight className="w-3 h-3 text-grey-muted" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8: Quick Guidance / Developer API shortcut */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-grey-border flex items-start gap-4">
          <div className="w-8 h-8 rounded-xl bg-yellow/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-charcoal" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-xs text-charcoal">Continuous Cloud Workspace</h4>
            <p className="text-[11px] text-grey-muted mt-1 leading-relaxed">
              Upload multiple workbooks, reload the browser, or switch tabs freely. Your workspace and files stay available until 30 minutes of inactivity.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-grey-border flex items-start gap-4">
          <div className="w-8 h-8 rounded-xl bg-grey-subtle flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-charcoal" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-xs text-charcoal">Programmatic Developer API</h4>
            <p className="text-[11px] text-grey-muted mt-1 leading-relaxed">
              Generate temporary bearer keys from the Developer Portal to profile and extract analytics via curl or Python scripts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
