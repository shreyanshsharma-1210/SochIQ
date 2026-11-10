"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  FileText,
  BookmarkPlus,
  RefreshCw,
  Check,
  Table,
  CheckCircle2,
  BarChart3,
  Sparkles,
  Plus,
  Layers,
  UploadCloud,
  X,
  Loader2,
} from "lucide-react";
import UploadDropzone from "@/components/datasets/UploadDropzone";
import PreviewGrid from "@/components/datasets/PreviewGrid";
import QualitySummary from "@/components/quality/QualitySummary";
import ChartViewer from "@/components/analytics/ChartViewer";
import RuleInsightsDeck from "@/components/insights/RuleInsightsDeck";
import GroqChatPanel from "@/components/insights/GroqChatPanel";
import { api } from "@/lib/apiClient";
import { useDatasetSession } from "@/context/DatasetSessionContext";

export default function UploadWorkspacePage() {
  const {
    datasets,
    activeDatasetId,
    activeFile,
    previewData,
    analyticsData,
    chartsData,
    insightsData,
    selectDataset,
    uploadDatasetToCloud,
    clearAnalysisSession,
  } = useDatasetSession();

  const [activeTab, setActiveTab] = useState<"overview" | "quality" | "analytics" | "insights">("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleProcessFile = async (file: File) => {
    console.log("UploadPage handleProcessFile starting for:", file.name);
    setIsLoading(true);
    setActiveTab("overview");
    try {
      await uploadDatasetToCloud(file);
      console.log("UploadPage uploadDatasetToCloud succeeded!");
      setShowUploadModal(false);
    } catch (err: any) {
      console.error("UploadPage upload error:", err);
      alert(err.message || "Failed to upload and analyze dataset.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!previewData) return;
    setIsExportingPDF(true);
    try {
      const blob = await api.downloadPDF(activeFile, activeDatasetId || undefined);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SochIQ_Report_${previewData.filename.split(".")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || "Failed to export PDF report");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportCSV = async () => {
    if (!previewData) return;
    setIsExportingCSV(true);
    try {
      const blob = await api.downloadCleanedCSV(activeFile, activeDatasetId || undefined);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SochIQ_Cleaned_${previewData.filename.split(".")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || "Failed to export cleaned CSV");
    } finally {
      setIsExportingCSV(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-8">
      {/* Multi-Dataset Workspace Switcher (When datasets exist) */}
      {datasets.length > 0 && (
        <div className="p-3 rounded-2xl bg-white border border-grey-border shadow-xs flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-grey-muted shrink-0 mr-1">
              Datasets:
            </span>
            {datasets.map((ds) => {
              const isCurrent = ds.id === activeDatasetId;
              return (
                <button
                  key={ds.id}
                  onClick={() => selectDataset(ds.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all ${
                    isCurrent
                      ? "bg-charcoal text-white shadow-xs"
                      : "bg-grey-subtle border border-grey-border text-charcoal hover:bg-grey-border/50"
                  }`}
                >
                  <FileSpreadsheet className={`w-3.5 h-3.5 ${isCurrent ? "text-yellow" : "text-grey-muted"}`} />
                  <span className="truncate max-w-[140px]">{ds.name}</span>
                  <span className="text-[10px] opacity-75 font-mono">({ds.file_format.toUpperCase()})</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3 py-1.5 rounded-full border border-dashed border-grey-border text-xs font-semibold text-charcoal hover:bg-grey-subtle flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-charcoal" />
            <span>Upload Another</span>
          </button>
        </div>
      )}

      {/* Upload Another Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-grey-border shadow-xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 p-1.5 text-grey-muted hover:text-charcoal rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-heading font-bold text-base text-charcoal mb-1">
              Add Dataset to Workspace
            </h3>
            <p className="text-xs text-grey-muted mb-4">
              Upload an additional CSV, Excel or JSON table. Both will remain accessible in your session.
            </p>
            <UploadDropzone onFileSelected={handleProcessFile} isLoading={isLoading} />
          </div>
        </div>
      )}

      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-grey-muted">
            Analysis Workspace
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">
            {previewData ? previewData.filename : "Upload & Analyze"}
          </h1>
          <p className="text-xs sm:text-sm text-grey-muted mt-1">
            {previewData
              ? "Cloud persisted evaluation • Ready for inspection and intelligence discovery"
              : "Upload a CSV, Excel or JSON table to begin your workspace session."}
          </p>
        </div>

        {previewData && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={isExportingCSV}
              className="px-3.5 py-2 rounded-xl border border-grey-border bg-white text-xs font-semibold text-charcoal hover:bg-grey-subtle flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-charcoal" />
              <span>Cleaned CSV</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="px-4 py-2 rounded-xl bg-charcoal text-white text-xs font-semibold hover:bg-black flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-yellow" />
              <span>{isExportingPDF ? "Building PDF..." : "Export PDF Report"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Dropzone when no file analyzed */}
      {!previewData ? (
        <div className="sochiq-card p-6 sm:p-10 bg-white border border-grey-border shadow-card">
          <UploadDropzone onFileSelected={handleProcessFile} isLoading={isLoading} />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Dataset Info Strip */}
          <div className="p-4 rounded-2xl bg-white border border-grey-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow/20 flex items-center justify-center text-charcoal shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-charcoal" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-sm text-charcoal">{previewData.filename}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                    Temporary Cloud Storage
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-grey-muted mt-0.5 font-mono">
                  <span className="uppercase font-semibold text-charcoal">{previewData.file_format}</span>
                  <span>•</span>
                  <span>{previewData.row_count.toLocaleString()} rows</span>
                  <span>•</span>
                  <span>{previewData.column_count} columns</span>
                  <span>•</span>
                  <span className="text-emerald-600 font-sans font-medium">Health: {previewData.quality.cleanliness_score.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="px-3.5 py-1.5 rounded-xl border border-grey-border bg-white text-xs font-semibold text-charcoal hover:bg-grey-subtle flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload New File</span>
            </button>
          </div>

          {/* 4 Navigation Tabs */}
          <div className="flex border-b border-grey-border gap-2 overflow-x-auto">
            {[
              { id: "overview", label: "Overview", icon: Table },
              { id: "quality", label: "Data Quality", icon: CheckCircle2 },
              { id: "analytics", label: "Analytics", icon: BarChart3 },
              { id: "insights", label: "AI Insights", icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? "border-charcoal text-charcoal font-bold"
                      : "border-transparent text-grey-muted hover:text-charcoal"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-charcoal" : "text-grey-muted"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Overview */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-white border border-grey-border">
                  <span className="text-[11px] font-semibold text-grey-muted uppercase tracking-wider">Total Rows</span>
                  <div className="font-heading text-xl font-bold text-charcoal mt-1 font-mono">
                    {previewData.row_count.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white border border-grey-border">
                  <span className="text-[11px] font-semibold text-grey-muted uppercase tracking-wider">Total Columns</span>
                  <div className="font-heading text-xl font-bold text-charcoal mt-1 font-mono">
                    {previewData.column_count}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white border border-grey-border">
                  <span className="text-[11px] font-semibold text-grey-muted uppercase tracking-wider">Missing Cells</span>
                  <div className="font-heading text-xl font-bold text-charcoal mt-1 font-mono">
                    {previewData.quality.missing_cells.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white border border-grey-border">
                  <span className="text-[11px] font-semibold text-grey-muted uppercase tracking-wider">Cleanliness</span>
                  <div className="font-heading text-xl font-bold text-emerald-600 mt-1 font-mono">
                    {previewData.quality.cleanliness_score.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="sochiq-card p-6 bg-white border border-grey-border">
                <PreviewGrid
                  columns={previewData.columns}
                  inferredTypes={previewData.inferred_types}
                  rows={previewData.preview_rows}
                  totalRows={previewData.row_count}
                />
              </div>
            </div>
          )}

          {/* Tab 2: Data Quality */}
          {activeTab === "quality" && (
            <div className="flex flex-col gap-6">
              <QualitySummary quality={previewData.quality} />
            </div>
          )}

          {/* Tab 3: Analytics */}
          {activeTab === "analytics" && (
            <div className="flex flex-col gap-6">
              {chartsData ? (
                <ChartViewer charts={chartsData.charts} />
              ) : (
                <div className="p-8 text-center text-xs text-grey-muted">Loading charts...</div>
              )}
            </div>
          )}

          {/* Tab 4: AI Insights */}
          {activeTab === "insights" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Rule Heuristic Observations */}
              <div className="order-2 lg:order-1 lg:col-span-5 flex flex-col">
                {insightsData ? (
                  <RuleInsightsDeck insights={insightsData.insights} />
                ) : (
                  <div className="w-full h-[720px] max-h-[85vh] bg-white border border-grey-border rounded-2xl shadow-card flex flex-col items-center justify-center p-8 text-center text-grey-muted">
                    <Loader2 className="w-6 h-6 animate-spin text-charcoal mb-2" />
                    <p className="text-xs">Computing heuristic rules...</p>
                  </div>
                )}
              </div>
              {/* Right Column: Spacious SochIQ AI Assistant */}
              <div className="order-1 lg:order-2 lg:col-span-7 flex flex-col">
                <GroqChatPanel
                  summaryContext={analyticsData}
                  qualityContext={previewData.quality}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
