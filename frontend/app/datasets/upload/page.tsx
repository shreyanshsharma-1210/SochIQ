"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  FileText,
  BookmarkPlus,
  RefreshCw,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Check,
} from "lucide-react";
import UploadDropzone from "@/components/datasets/UploadDropzone";
import PreviewGrid from "@/components/datasets/PreviewGrid";
import QualitySummary from "@/components/quality/QualitySummary";
import ChartViewer from "@/components/analytics/ChartViewer";
import RuleInsightsDeck from "@/components/insights/RuleInsightsDeck";
import GroqChatPanel from "@/components/insights/GroqChatPanel";
import { api } from "@/lib/apiClient";
import { useDatasetSession } from "@/context/DatasetSessionContext";

export default function UploadPage() {
  const {
    activeFile,
    previewData,
    analyticsData,
    chartsData,
    insightsData,
    setAnalysisSession,
    clearAnalysisSession,
  } = useDatasetSession();

  const [activeTab, setActiveTab] = useState<"preview" | "quality" | "analytics" | "insights">("preview");
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
        a.download = `DataLens_Report_${activeFile.name.split(".")[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("Please re-select original file to generate fresh PDF stream.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to generate PDF");
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
        a.download = `cleaned_${activeFile.name.split(".")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("Please re-select original file to generate fresh CSV stream.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to export CSV");
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-text">Dataset Ingestion & Workspace</h1>
          <p className="text-sm text-text-muted mt-1">
            In-memory evaluation of CSV, Excel, or JSON datasets with zero retention.
          </p>
        </div>

        {previewData && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveMetadata}
              disabled={isSaving || savedSuccess}
              className="px-3.5 py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-text hover:bg-surface/80 flex items-center gap-1.5 transition-colors"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Metadata Saved</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-3.5 h-3.5 text-primary" />
                  <span>Save Metadata</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportCSV}
              disabled={isExportingCSV}
              className="px-3.5 py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-text hover:bg-surface/80 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-gold" />
              <span>Cleaned CSV</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="diwali-button-primary px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isExportingPDF ? "Building PDF..." : "Export PDF Report"}</span>
            </button>
          </div>
        )}
      </div>

      {!previewData ? (
        <UploadDropzone onFileSelected={handleProcessFile} isLoading={isLoading} />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Active File Bar */}
          <div className="diwali-card px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-surface to-primary-light/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center text-primary font-bold">
                <FileSpreadsheet className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-text">{previewData.filename}</h3>
                <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                  <span className="uppercase font-semibold text-primary">{previewData.file_format}</span>
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
              className="px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-text-muted hover:text-text flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Analyze Another File</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border gap-2">
            {[
              { id: "preview", label: "Data Preview" },
              { id: "quality", label: "Quality Audit" },
              { id: "analytics", label: "Visual Analytics" },
              { id: "insights", label: "Insights & AI" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-text-muted hover:text-text"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Panes */}
          {activeTab === "preview" && (
            <PreviewGrid
              columns={previewData.columns}
              inferredTypes={previewData.inferred_types}
              rows={previewData.preview_rows}
              totalRows={previewData.row_count}
            />
          )}

          {activeTab === "quality" && <QualitySummary quality={previewData.quality} />}

          {activeTab === "analytics" && chartsData && <ChartViewer charts={chartsData.charts} />}

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
