"use client";

import { useEffect, useState } from "react";
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
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import UploadDropzone from "@/components/datasets/UploadDropzone";
import { api } from "@/lib/apiClient";
import { DatasetMetadata } from "@/types";
import { useDatasetSession } from "@/context/DatasetSessionContext";

export default function OverviewDashboardPage() {
  const router = useRouter();
  const { setAnalysisSession } = useDatasetSession();
  const [savedDatasets, setSavedDatasets] = useState<DatasetMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  useEffect(() => {
    loadSaved();
  }, []);

  const loadSaved = async () => {
    try {
      const data = await api.getSavedDatasets();
      setSavedDatasets(data);
    } catch (e) {
      console.warn("Failed to load saved metadata:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessFile = async (file: File) => {
    setIsProcessingUpload(true);
    try {
      const [prev, analytics, charts, insights] = await Promise.all([
        api.previewDataset(file),
        api.getAnalytics(file),
        api.getCharts(file),
        api.getRuleInsights(file),
      ]);

      setAnalysisSession(file, prev, analytics, charts, insights);
      router.push("/app/upload");
    } catch (err: any) {
      alert(err.message || "Failed to process dataset in memory.");
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this saved dataset metadata profile?")) {
      await api.deleteSavedDataset(id);
      loadSaved();
    }
  };

  const totalRecords = savedDatasets.reduce((acc, curr) => acc + (curr.row_count || 0), 0);

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
          Upload any CSV, Excel or JSON table for instant in-memory profiling, automated quality inspection, and AI-grounded insights.
        </p>
      </div>

      {/* 4: Prominent Dataset Upload Area (Primary Visual Focus!) */}
      <div className="sochiq-card p-6 sm:p-8 bg-white border border-grey-border shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow" />
            <h2 className="font-heading text-sm font-bold text-charcoal uppercase tracking-wider">
              Start In-Memory Analysis
            </h2>
          </div>
          <span className="text-[11px] font-mono text-grey-muted">
            Max 25 MB • Zero raw storage
          </span>
        </div>

        <UploadDropzone onFileSelected={handleProcessFile} isLoading={isProcessingUpload} />
      </div>

      {/* 5: Three Compact Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sochiq-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-grey-muted">
            <span>Datasets Profiled</span>
            <Layers className="w-4 h-4 text-charcoal" />
          </div>
          <div className="font-heading text-3xl font-bold text-charcoal mt-2">
            {savedDatasets.length}
          </div>
          <p className="text-[11px] text-grey-muted mt-1">Saved metadata profiles in session</p>
        </div>

        <div className="sochiq-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-grey-muted">
            <span>Records Analyzed</span>
            <FileSpreadsheet className="w-4 h-4 text-charcoal" />
          </div>
          <div className="font-heading text-3xl font-bold text-charcoal mt-2">
            {totalRecords.toLocaleString()}
          </div>
          <p className="text-[11px] text-grey-muted mt-1">Evaluated across all processed tables</p>
        </div>

        <div className="sochiq-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-grey-muted">
            <span>Privacy Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <span className="font-heading text-xl font-bold text-charcoal">Memory Only</span>
          </div>
          <p className="text-[11px] text-grey-muted mt-1">No raw data stored on server or cloud</p>
        </div>
      </div>

      {/* 6: Recent Activity / Saved Metadata Profiles */}
      <div className="sochiq-card overflow-hidden">
        <div className="px-6 py-4 border-b border-grey-border bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-sm font-bold text-charcoal">
              Recent Saved Profiles
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-grey-subtle text-grey-muted">
              {savedDatasets.length}
            </span>
          </div>
          {savedDatasets.length > 0 && (
            <Link
              href="/app/analyses"
              className="text-xs font-semibold text-charcoal hover:underline flex items-center gap-1"
            >
              <span>View All in My Analyses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-grey-muted">Loading saved profiles...</div>
        ) : savedDatasets.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center gap-2">
            <FileSpreadsheet className="w-8 h-8 text-grey-muted/50" />
            <p className="font-heading font-bold text-charcoal text-xs">No saved profiles yet</p>
            <p className="text-xs text-grey-muted">
              Upload a dataset above to generate and optionally save its column metadata profile.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-grey-subtle text-grey-muted font-semibold uppercase tracking-wider border-b border-grey-border">
                <tr>
                  <th className="px-6 py-3">Dataset Name</th>
                  <th className="px-6 py-3">Format</th>
                  <th className="px-6 py-3">Records</th>
                  <th className="px-6 py-3">Columns</th>
                  <th className="px-6 py-3">Saved Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-border">
                {savedDatasets.slice(0, 5).map((ds) => (
                  <tr key={ds.id} className="hover:bg-grey-subtle/50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-charcoal">{ds.name}</td>
                    <td className="px-6 py-3.5">
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded font-mono font-bold bg-yellow/20 text-charcoal border border-yellow/40">
                        {ds.file_format}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-charcoal">
                      {ds.row_count.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-charcoal">{ds.column_count}</td>
                    <td className="px-6 py-3.5 text-grey-muted">
                      {new Date(ds.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(ds.id)}
                        className="p-1.5 rounded-lg text-grey-muted hover:text-red-700 hover:bg-red-50 transition-colors"
                        title="Delete Metadata"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 7: Optional Getting-Started Guidance */}
      <div className="p-4 rounded-2xl bg-grey-subtle/70 border border-grey-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-grey-muted">
        <div className="flex items-center gap-2.5">
          <HelpCircle className="w-4 h-4 text-charcoal shrink-0" />
          <span>
            <b>Quick Start:</b> Upload a file above. Once evaluated, inspect data hygiene, descriptive distributions, and ask questions to the SochIQ AI Assistant.
          </span>
        </div>
        <Link
          href="/app/developer"
          className="text-charcoal font-semibold hover:underline flex items-center gap-1 shrink-0"
        >
          <span>API Access</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
