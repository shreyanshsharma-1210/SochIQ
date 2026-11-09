"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Layers,
} from "lucide-react";
import { api } from "@/lib/apiClient";
import { DatasetMetadata } from "@/types";

export default function AppDashboardPage() {
  const [savedDatasets, setSavedDatasets] = useState<DatasetMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleDelete = async (id: string) => {
    if (confirm("Delete this saved dataset metadata profile?")) {
      await api.deleteSavedDataset(id);
      loadSaved();
    }
  };

  const totalRecords = savedDatasets.reduce((acc, curr) => acc + (curr.row_count || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="sochiq-card p-6 sm:p-8 bg-white border border-grey-border relative overflow-hidden">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow/20 text-charcoal border border-yellow/40 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-charcoal" />
            <span>SochIQ Intelligence Workspace</span>
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">
            Welcome to SochIQ. <br />
            <span className="text-grey-muted font-normal text-xl sm:text-2xl">
              Your workspace for smarter data analysis.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-grey-muted mt-2.5 leading-relaxed">
            Upload CSV, Excel, or JSON files for instant in-memory profiling, automated quality inspection,
            descriptive statistics, and executive PDF reporting — with zero raw data persistence.
          </p>

          <div className="flex items-center gap-3 mt-6">
            <Link
              href="/app/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-charcoal text-white text-xs sm:text-sm font-semibold hover:bg-charcoal-deep transition-all shadow-xs group"
            >
              <UploadCloud className="w-4 h-4 text-yellow" />
              <span>Upload Dataset</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/app/developer"
              className="px-4 py-2.5 rounded-xl border border-grey-border bg-white text-xs sm:text-sm font-medium text-charcoal hover:bg-grey-subtle transition-colors"
            >
              Explore API
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sochiq-card p-5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-grey-muted">
            <span>Saved Metadata Profiles</span>
            <Layers className="w-4 h-4 text-charcoal" />
          </div>
          <div className="font-heading text-3xl font-bold text-charcoal mt-2">
            {savedDatasets.length}
          </div>
          <p className="text-[11px] text-grey-muted mt-1">Scoped to your anonymous cloud session</p>
        </div>

        <div className="sochiq-card p-5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-grey-muted">
            <span>Total Records Profiled</span>
            <FileSpreadsheet className="w-4 h-4 text-charcoal" />
          </div>
          <div className="font-heading text-3xl font-bold text-charcoal mt-2">
            {totalRecords.toLocaleString()}
          </div>
          <p className="text-[11px] text-grey-muted mt-1">Evaluated across all processed tables</p>
        </div>

        <div className="sochiq-card p-5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-grey-muted">
            <span>Privacy Safeguard</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <span className="font-heading text-xl font-bold text-charcoal">Memory Only</span>
          </div>
          <p className="text-[11px] text-grey-muted mt-1">No permanent cloud storage of raw dataset rows</p>
        </div>
      </div>

      {/* Recent Saved Dataset Metadata */}
      <div className="sochiq-card overflow-hidden">
        <div className="px-6 py-4 border-b border-grey-border bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-sm font-bold text-charcoal">
              Recent Saved Dataset Metadata
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-grey-subtle text-grey-muted">
              {savedDatasets.length}
            </span>
          </div>
          <Link
            href="/app/upload"
            className="text-xs font-semibold text-charcoal hover:underline flex items-center gap-1"
          >
            <span>New Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-xs text-grey-muted">Loading saved metadata...</div>
        ) : savedDatasets.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-grey-subtle flex items-center justify-center text-grey-muted">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <p className="font-heading font-bold text-charcoal text-sm">No datasets saved yet</p>
              <p className="text-xs text-grey-muted mt-0.5">
                Upload a dataset to start discovering insights.
              </p>
            </div>
            <Link
              href="/app/upload"
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-charcoal text-white text-xs font-semibold hover:bg-charcoal-deep transition-all"
            >
              <UploadCloud className="w-3.5 h-3.5 text-yellow" />
              <span>Upload Dataset</span>
            </Link>
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
                  <th className="px-6 py-3">Saved Timestamp</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-border">
                {savedDatasets.map((ds) => (
                  <tr key={ds.id} className="hover:bg-grey-subtle/40 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-charcoal">{ds.name}</td>
                    <td className="px-6 py-3.5">
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded font-mono font-bold bg-yellow/20 text-charcoal border border-yellow/40">
                        {ds.file_format}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-charcoal">{ds.row_count.toLocaleString()}</td>
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
    </div>
  );
}
