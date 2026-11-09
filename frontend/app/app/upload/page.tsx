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
    activeFile,
    previewData,
    analyticsData,
    chartsData,
    insightsData,
    setAnalysisSession,
    clearAnalysisSession,
  } = useDatasetSession();

  const [activeTab, setActiveTab] = useState<"overview" | "quality" | "analytics" | "insights">("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleProcessFile = async (file: File) => {
    setIsLoading(true);
    setSavedSuccess(false);

    try {
      // Execute all in-memory analytics in parallel
      const [prev, analytics, charts, insights] = await Promise.all([
        api.previewDataset(file),
        api.getAnalytics(file),
        api.getCharts(file),
        api.getRuleInsights(file),
      ]);

      // Save into persistent tab session context
      setAnalysisSession(file, prev, analytics, charts, insights);
      setActiveTab("overview");
    } catch (err: any) {
      alert(err.message || "Failed to process dataset in memory.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!activeFile && !previewData) return;
    setIsExportingPDF(true);
    try {
      if (activeFile) {
        const blob = await api.downloadPDF(activeFile);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `SochIQ_Report_${activeFile.name.split(".")[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("Please re-select original file to generate fresh PDF stream.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to export PDF report");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportCSV = async () => {
    if (!activeFile && !previewData) return;
    setIsExportingCSV(true);
    try {
      if (activeFile) {
        const blob = await api.downloadCleanedCSV(activeFile);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `SochIQ_Cleaned_${activeFile.name.split(".")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("Please re-select original file to generate fresh CSV stream.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to export cleaned CSV");
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleSaveMetadata = async () => {
    if (!previewData) return;
    setIsSaving(true);
    try {
      await api.saveMetadata({
        name: previewData.filename.split(".")[0],
        original_filename: previewData.filename,
        file_format: previewData.file_format,
        row_count: previewData.row_count,
        column_count: previewData.column_count,
        column_summary: previewData.quality.column_audits,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (e: any) {
      alert(e.message || "Failed to save metadata to Supabase");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-8">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-grey-muted">
            Analysis Workspace
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">
            {previewData ? previewData.filename : "New Analysis"}
          </h1>
          <p className="text-xs sm:text-sm text-grey-muted mt-1">
            {previewData
              ? "In-memory evaluation complete • Ready for inspection and intelligence discovery"
              : "Upload a CSV, Excel or JSON table to begin an in-memory session."}
          </p>
        </div>

        {previewData && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveMetadata}
              disabled={isSaving || savedSuccess}
              className="px-3.5 py-2 rounded-xl border border-grey-border bg-white text-xs font-semibold text-charcoal hover:bg-grey-subtle flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Metadata Saved</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-3.5 h-3.5 text-charcoal" />
                  <span>Save Metadata</span>
                </>
              )}
            </button>

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
              className="px-4 py-2 rounded-xl bg-charcoal text-white text-xs font-semibold hover:bg-charcoal-deep flex items-center gap-1.5 transition-colors shadow-xs"
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
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-charcoal">{previewData.filename}</h3>
                <div className="flex items-center gap-3 text-xs text-grey-muted mt-0.5 font-mono">
                  <span className="uppercase font-semibold text-charcoal">{previewData.file_format}</span>
                  <span>•</span>
                  <span>{previewData.row_count.toLocaleString()} rows</span>
                  <span>•</span>
                  <span>{previewData.column_count} columns</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (confirm("Reset current dataset session and analyze another file?")) {
                  clearAnalysisSession();
                }
              }}
              className="px-3 py-1.5 rounded-xl border border-grey-border bg-white text-xs font-medium text-grey-muted hover:text-charcoal hover:bg-grey-subtle flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Analyze Another File</span>
            </button>
          </div>

          {/* 4 Clearly Named Navigation Tabs */}
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

          {/* Tab 1: Overview — Dataset preview, schema and summary */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="sochiq-card p-4">
                  <span className="text-[11px] font-semibold text-grey-muted uppercase tracking-wider">
                    Total Rows
                  </span>
                  <div className="font-heading text-2xl font-bold text-charcoal mt-1">
                    {previewData.row_count.toLocaleString()}
                  </div>
                </div>
                <div className="sochiq-card p-4">
                  <span className="text-[11px] font-semibold text-grey-muted uppercase tracking-wider">
                    Total Columns
                  </span>
                  <div className="font-heading text-2xl font-bold text-charcoal mt-1">
                    {previewData.column_count}
                  </div>
                </div>
                <div className="sochiq-card p-4">
                  <span className="text-[11px] font-semibold text-grey-muted uppercase tracking-wider">
                    Data Cleanliness
                  </span>
                  <div className="font-heading text-2xl font-bold text-emerald-700 mt-1">
                    {previewData.quality?.cleanliness_score ?? 100}%
                  </div>
                </div>
                <div className="sochiq-card p-4">
                  <span className="text-[11px] font-semibold text-grey-muted uppercase tracking-wider">
                    Memory Retention
                  </span>
                  <div className="font-heading text-xl font-bold text-charcoal mt-1 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Volatile</span>
                  </div>
                </div>
              </div>

              <PreviewGrid
                columns={previewData.columns}
                inferredTypes={previewData.inferred_types}
                rows={previewData.preview_rows}
                totalRows={previewData.row_count}
              />
            </div>
          )}

          {/* Tab 2: Data Quality — Cleanliness score, missing values, duplicates, column-level audit */}
          {activeTab === "quality" && <QualitySummary quality={previewData.quality} />}

          {/* Tab 3: Analytics — Descriptive statistics, aggregations, Recharts */}
          {activeTab === "analytics" && chartsData && <ChartViewer charts={chartsData.charts} />}

          {/* Tab 4: AI Insights — Deterministic observations + Groq-powered natural-language analysis */}
          {activeTab === "insights" && (
            <div className="flex flex-col gap-6">
              {insightsData && <RuleInsightsDeck insights={insightsData.insights} />}
              <GroqChatPanel
                summaryContext={analyticsData}
                qualityContext={previewData.quality}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
