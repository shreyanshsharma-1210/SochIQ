"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  Trash2,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/apiClient";
import { DatasetMetadata } from "@/types";

export default function DashboardPage() {
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
    if (confirm("Delete this saved dataset metadata?")) {
      await api.deleteSavedDataset(id);
      loadSaved();
    }
  };

  const totalRecords = savedDatasets.reduce((acc, curr) => acc + (curr.row_count || 0), 0);

  return (
    <div className="flex flex-col gap-8">
      {/* Hero Section */}
      <div className="diwali-card p-8 bg-gradient-to-r from-surface via-primary-light/20 to-surface border border-gold/40 relative overflow-hidden">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full diwali-badge-gold text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>Cloud Architecture 2.0</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text tracking-tight">
            Understand your data. <br />
            <span className="text-primary font-normal italic">Discover what matters.</span>
          </h1>
          <p className="text-sm text-text-muted mt-3 leading-relaxed">
            Upload CSV, Excel, or JSON files for instant in-memory profiling, automated quality inspection,
            descriptive statistics, and executive PDF reporting — with zero raw data persistence.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <Link
              href="/datasets/upload"
              className="diwali-button-primary px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Dataset</span>
            </Link>
            <Link
              href="/developer"
              className="px-4 py-2.5 rounded-xl border border-border bg-surface text-sm font-medium text-text-muted hover:text-text hover:bg-surface/80 transition-colors"
            >
              Explore API
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="diwali-card p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Saved Metadata Profiles</span>
          <div className="font-serif text-3xl font-bold text-text mt-2">{savedDatasets.length}</div>
          <p className="text-[11px] text-text-muted mt-1">Scoped to your anonymous cloud session</p>
        </div>

        <div className="diwali-card p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Records Profiled</span>
          <div className="font-serif text-3xl font-bold text-text mt-2">{totalRecords.toLocaleString()}</div>
          <p className="text-[11px] text-text-muted mt-1">Evaluated across all processed tables</p>
        </div>

        <div className="diwali-card p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Privacy Safeguard</span>
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            <span className="text-lg font-bold text-text">Memory Only</span>
          </div>
          <p className="text-[11px] text-text-muted mt-1">No permanent cloud storage of raw dataset rows</p>
        </div>
      </div>

      {/* Recent Datasets */}
      <div className="diwali-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-surface flex items-center justify-between">
          <h3 className="font-serif text-base font-bold text-text">Recent Saved Dataset Metadata</h3>
          <Link href="/datasets/upload" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            <span>New Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-text-muted">Loading saved metadata...</div>
        ) : savedDatasets.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center gap-2">
            <FileSpreadsheet className="w-10 h-10 text-border-dark" />
            <p className="font-semibold text-text text-sm">No saved dataset metadata yet</p>
            <p className="text-xs text-text-muted">Upload a CSV, Excel, or JSON file to begin instant analysis.</p>
            <Link
              href="/datasets/upload"
              className="mt-3 diwali-button-primary px-4 py-2 rounded-lg text-xs font-semibold"
            >
              Upload Now
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-primary-light/40 text-text-muted text-xs uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-3">Dataset Name</th>
                  <th className="px-6 py-3">Format</th>
                  <th className="px-6 py-3">Records</th>
                  <th className="px-6 py-3">Columns</th>
                  <th className="px-6 py-3">Saved Timestamp</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {savedDatasets.map((ds) => (
                  <tr key={ds.id} className="hover:bg-surface/60 transition-colors">
                    <td className="px-6 py-3 font-medium text-text">{ds.name}</td>
                    <td className="px-6 py-3">
                      <span className="text-xs uppercase px-2 py-0.5 rounded diwali-badge-gold font-bold">
                        {ds.file_format}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-text">{ds.row_count.toLocaleString()}</td>
                    <td className="px-6 py-3 text-text">{ds.column_count}</td>
                    <td className="px-6 py-3 text-text-muted text-xs">
                      {new Date(ds.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => handleDelete(ds.id)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-maroon hover:bg-maroon-light transition-colors"
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

