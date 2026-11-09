"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  DatasetPreviewResponse,
  AnalyticsSummaryResponse,
  ChartDataResponse,
  RuleInsightsResponse,
} from "@/types";

interface DatasetSessionContextType {
  activeFile: File | null;
  previewData: DatasetPreviewResponse | null;
  analyticsData: AnalyticsSummaryResponse | null;
  chartsData: ChartDataResponse | null;
  insightsData: RuleInsightsResponse | null;
  hasActiveAnalysis: boolean;
  setAnalysisSession: (
    file: File,
    preview: DatasetPreviewResponse,
    analytics: AnalyticsSummaryResponse,
    charts: ChartDataResponse,
    insights: RuleInsightsResponse
  ) => void;
  clearAnalysisSession: () => void;
}

const DatasetSessionContext = createContext<DatasetSessionContextType | undefined>(undefined);

const STORAGE_KEY = "sochiq_active_analysis_v2";

export function DatasetSessionProvider({ children }: { children: React.ReactNode }) {
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<DatasetPreviewResponse | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummaryResponse | null>(null);
  const [chartsData, setChartsData] = useState<ChartDataResponse | null>(null);
  const [insightsData, setInsightsData] = useState<RuleInsightsResponse | null>(null);

  // Restore session from sessionStorage on mount (survives client-side route changes within tab)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.previewData) {
          setPreviewData(parsed.previewData);
          setAnalyticsData(parsed.analyticsData);
          setChartsData(parsed.chartsData);
          setInsightsData(parsed.insightsData);
        }
      }
    } catch (e) {
      console.warn("Could not restore tab session:", e);
    }
  }, []);

  // Browser reload / leave warning popup if active analysis exists
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (previewData) {
        e.preventDefault();
        e.returnValue = "Your current dataset analysis will be lost if you leave or reload this tab. Are you sure?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [previewData]);

  const setAnalysisSession = (
    file: File,
    preview: DatasetPreviewResponse,
    analytics: AnalyticsSummaryResponse,
    charts: ChartDataResponse,
    insights: RuleInsightsResponse
  ) => {
    setActiveFile(file);
    setPreviewData(preview);
    setAnalyticsData(analytics);
    setChartsData(charts);
    setInsightsData(insights);

    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          previewData: preview,
          analyticsData: analytics,
          chartsData: charts,
          insightsData: insights,
        })
      );
    } catch (e) {
      console.warn("Could not persist session to sessionStorage:", e);
    }
  };

  const clearAnalysisSession = () => {
    setActiveFile(null);
    setPreviewData(null);
    setAnalyticsData(null);
    setChartsData(null);
    setInsightsData(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  };

  return (
    <DatasetSessionContext.Provider
      value={{
        activeFile,
        previewData,
        analyticsData,
        chartsData,
        insightsData,
        hasActiveAnalysis: !!previewData,
        setAnalysisSession,
        clearAnalysisSession,
      }}
    >
      {children}
    </DatasetSessionContext.Provider>
  );
}

export function useDatasetSession() {
  const context = useContext(DatasetSessionContext);
  if (!context) {
    throw new Error("useDatasetSession must be used within a DatasetSessionProvider");
  }
  return context;
}

