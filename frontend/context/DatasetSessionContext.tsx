"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/apiClient";
import {
  DatasetPreviewResponse,
  AnalyticsSummaryResponse,
  ChartDataResponse,
  RuleInsightsResponse,
  DatasetMetadata,
  AnalysisRun,
  SessionStatus
} from "@/types";

interface DatasetSessionContextType {
  // Session lifecycle
  sessionStatus: SessionStatus | null;
  remainingSeconds: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  refreshSession: () => Promise<void>;

  // Cloud datasets & Workspace
  datasets: DatasetMetadata[];
  activeDatasetId: string | null;
  activeDataset: DatasetMetadata | null;
  analysisHistory: AnalysisRun[];
  isLoadingWorkspace: boolean;
  uploadDatasetToCloud: (file: File) => Promise<any>;
  selectDataset: (datasetId: string) => Promise<void>;
  deleteDatasetFromCloud: (datasetId: string) => Promise<void>;
  refreshDatasets: () => Promise<void>;
  reopenAnalysisRun: (analysisId: string) => Promise<void>;

  // Active dataset state (for UI tabs)
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
const ACTIVE_DS_KEY = "sochiq_active_dataset_id";

export function DatasetSessionProvider({ children }: { children: React.ReactNode }) {
  // Session status state
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(1800);
  const [isExpired, setIsExpired] = useState(false);

  // Workspace datasets
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisRun[]>([]);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);

  // Active dataset components (hydrated from Supabase)
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<DatasetPreviewResponse | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummaryResponse | null>(null);
  const [chartsData, setChartsData] = useState<ChartDataResponse | null>(null);
  const [insightsData, setInsightsData] = useState<RuleInsightsResponse | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Refresh session info and datasets from backend
  const refreshSession = useCallback(async () => {
    try {
      const sess = await api.initWorkspaceSession();
      setSessionStatus(sess);
      setRemainingSeconds(sess.remaining_seconds || 1800);
      setIsExpired(false);
    } catch (e) {
      console.warn("Could not refresh workspace session:", e);
    }
  }, []);

  const refreshDatasets = useCallback(async () => {
    try {
      const [dsList, histList] = await Promise.all([
        api.listDatasets(),
        api.listAnalyses()
      ]);
      setDatasets(dsList);
      setAnalysisHistory(histList);
    } catch (e) {
      console.warn("Could not list datasets:", e);
    }
  }, []);

  // 2. Select and restore a dataset from cloud storage
  const selectDataset = useCallback(async (datasetId: string) => {
    setIsLoadingWorkspace(true);
    try {
      const data = await api.getDatasetDetails(datasetId);
      setActiveDatasetId(datasetId);
      try {
        sessionStorage.setItem(ACTIVE_DS_KEY, datasetId);
      } catch {}

      if (data.preview) setPreviewData(data.preview);
      if (data.analytics) setAnalyticsData(data.analytics);
      if (data.charts) setChartsData(data.charts);
      if (data.insights) setInsightsData(data.insights);

      // Extend session on activity
      setRemainingSeconds(1800);
    } catch (e: any) {
      console.error("Failed to load dataset details:", e);
    } finally {
      setIsLoadingWorkspace(false);
    }
  }, []);

  // 3. Upload a new dataset to Supabase Storage & Database
  const uploadDatasetToCloud = useCallback(async (file: File) => {
    setIsLoadingWorkspace(true);
    try {
      const result = await api.uploadDataset(file);
      setActiveFile(file);
      setActiveDatasetId(result.dataset_id);
      try {
        sessionStorage.setItem(ACTIVE_DS_KEY, result.dataset_id);
      } catch {}

      setPreviewData(result.preview);
      setAnalyticsData(result.analytics);
      setChartsData(result.charts);
      setInsightsData(result.insights);

      // Extend session
      setRemainingSeconds(1800);

      // Refresh datasets list
      await refreshDatasets();
      return result;
    } finally {
      setIsLoadingWorkspace(false);
    }
  }, [refreshDatasets]);

  // 4. Delete a dataset from Cloud
  const deleteDatasetFromCloud = useCallback(async (datasetId: string) => {
    try {
      await api.deleteDataset(datasetId);
      if (activeDatasetId === datasetId) {
        setActiveDatasetId(null);
        setPreviewData(null);
        setAnalyticsData(null);
        setChartsData(null);
        setInsightsData(null);
        try {
          sessionStorage.removeItem(ACTIVE_DS_KEY);
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {}
      }
      await refreshDatasets();
    } catch (e: any) {
      alert(e.message || "Failed to delete dataset from cloud");
    }
  }, [activeDatasetId, refreshDatasets]);

  // 5. Reopen an analysis run
  const reopenAnalysisRun = useCallback(async (analysisId: string) => {
    try {
      const run = await api.getAnalysisDetails(analysisId);
      if (run && run.dataset_id) {
        await selectDataset(run.dataset_id);
      }
    } catch (e) {
      console.warn("Could not reopen analysis run:", e);
    }
  }, [selectDataset]);

  // Initial workspace load
  useEffect(() => {
    let isMounted = true;

    async function init() {
      setIsLoadingWorkspace(true);
      try {
        // Establish or restore session
        const sess = await api.initWorkspaceSession();
        if (!isMounted) return;
        setSessionStatus(sess);
        setRemainingSeconds(sess.remaining_seconds || 1800);

        // Fetch user's datasets & analysis history
        const [dsList, histList] = await Promise.all([
          api.listDatasets(),
          api.listAnalyses()
        ]);
        if (!isMounted) return;
        setDatasets(dsList);
        setAnalysisHistory(histList);

        // Check if there was an active dataset previously selected
        const savedActiveId = sessionStorage.getItem(ACTIVE_DS_KEY);
        const targetId = (savedActiveId && dsList.some(d => d.id === savedActiveId))
          ? savedActiveId
          : (dsList.length > 0 ? dsList[0].id : null);

        if (targetId) {
          await selectDataset(targetId);
        } else {
          // Check local fallback
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
        }
      } catch (err) {
        console.warn("Workspace init warning:", err);
      } finally {
        if (isMounted) setIsLoadingWorkspace(false);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [selectDataset]);

  // 6. Inactivity countdown ticker
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const activeDataset = datasets.find(d => d.id === activeDatasetId) || null;
  const isExpiringSoon = remainingSeconds > 0 && remainingSeconds <= 300; // <= 5 minutes

  // Backward-compatible methods
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
    } catch {}
  };

  const clearAnalysisSession = () => {
    setActiveFile(null);
    setPreviewData(null);
    setAnalyticsData(null);
    setChartsData(null);
    setInsightsData(null);
    setActiveDatasetId(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(ACTIVE_DS_KEY);
    } catch {}
  };

  return (
    <DatasetSessionContext.Provider
      value={{
        sessionStatus,
        remainingSeconds,
        isExpiringSoon,
        isExpired,
        refreshSession,

        datasets,
        activeDatasetId,
        activeDataset,
        analysisHistory,
        isLoadingWorkspace,
        uploadDatasetToCloud,
        selectDataset,
        deleteDatasetFromCloud,
        refreshDatasets,
        reopenAnalysisRun,

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
