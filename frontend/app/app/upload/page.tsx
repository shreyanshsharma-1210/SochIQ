"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  FileText,
  BookmarkPlus,
  RefreshCw,
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
      setActiveTab("preview");
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
    <div className="flex flex-col gap-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">
            Dataset Ingestion & Workspace
          </h1>
          <p className="text-xs sm:text-sm text-grey-muted mt-1">
            In-memory evaluation of CSV, Excel, or JSON datasets with zero retention.
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
        <UploadDropzone onFileSelected={handleProcessFile} isLoading={isLoading} />
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

          {/* Navigation Tabs */}
          <div className="flex border-b border-grey-border gap-2">
            {[
              { id: "preview", label: "Data Preview" },
              { id: "quality", label: "Quality Audit" },
              { id: "analytics", label: "Visual Analytics" },
              { id: "insights", label: "Insights & AI" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-charcoal text-charcoal font-bold"
                    : "border-transparent text-grey-muted hover:text-charcoal"
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
