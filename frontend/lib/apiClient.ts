import { getOrCreateAnonymousSession } from "./supabaseClient";
import {
  DatasetPreviewResponse,
  AnalyticsSummaryResponse,
  ChartDataResponse,
  RuleInsightsResponse,
  DatasetMetadata,
} from "@/types";

export function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:8000/api/v1";
    }
    return "https://sochiq-backend.onrender.com/api/v1";
  }
  return "https://sochiq-backend.onrender.com/api/v1";
}

const API_BASE = getApiBase();

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getOrCreateAnonymousSession();
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  async initBrowserSession() {
    const res = await fetch(`${API_BASE}/auth/session`, {
      method: "POST",
      credentials: "include", // Ensures HttpOnly cookie is saved by browser
    });
    if (!res.ok) throw new Error("Failed to initialize browser session.");
    return res.json();
  },

  async logoutBrowserSession() {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  },

  async generateDeveloperAPIKey(scopes?: string[]) {
    const res = await fetch(`${API_BASE}/auth/keys/generate`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scopes }),
    });
    if (!res.ok) throw new Error("Failed to generate Developer API Key.");
    return res.json();
  },

  async listDeveloperAPIKeys() {
    const res = await fetch(`${API_BASE}/auth/keys`, {
      credentials: "include",
    });
    if (!res.ok) return [];
    return res.json();
  },

  async revokeDeveloperAPIKey(keyId: string) {
    const res = await fetch(`${API_BASE}/auth/keys/${keyId}`, {
      method: "DELETE",
      credentials: "include",
    });
    return res.ok;
  },
  async checkHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error("Backend service unreachable");
    return res.json();
  },

  async previewDataset(file: File): Promise<DatasetPreviewResponse> {
    const headers = await getAuthHeaders();
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/datasets/preview`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Failed to process dataset in memory.");
    }
    return res.json();
  },

  async getAnalytics(file: File): Promise<AnalyticsSummaryResponse> {
    const headers = await getAuthHeaders();
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/analytics/summary`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to compute analytics.");
    return res.json();
  },

  async getCharts(file: File): Promise<ChartDataResponse> {
    const headers = await getAuthHeaders();
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/analytics/chart-data`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to load chart series.");
    return res.json();
  },

  async getRuleInsights(file: File): Promise<RuleInsightsResponse> {
    const headers = await getAuthHeaders();
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/insights/rules`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to generate heuristic insights.");
    return res.json();
  },

  async askAI(question: string, summaryContext: any, qualityContext: any): Promise<import("../types/ai").AIQueryResponse> {
    const headers = await getAuthHeaders();
    (headers as any)["Content-Type"] = "application/json";

    const res = await fetch(`${API_BASE}/ai/query`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({
        question,
        summary_context: summaryContext,
        quality_context: qualityContext,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "AI Assistant unavailable" }));
      throw new Error(err.detail || "AI request failed.");
    }
    const data = await res.json();
    return data;
  },

  async downloadCleanedCSV(file?: File | null, datasetId?: string): Promise<Blob> {
    const headers = await getAuthHeaders();
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/exports/csv`, {
        method: "POST",
        headers,
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to generate clean CSV.");
      return res.blob();
    } else if (datasetId) {
      const res = await fetch(`${API_BASE}/exports/csv/${datasetId}`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate clean CSV.");
      return res.blob();
    }
    throw new Error("Either file or datasetId required.");
  },

  async downloadPDF(file?: File | null, datasetId?: string): Promise<Blob> {
    const headers = await getAuthHeaders();
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/exports/pdf`, {
        method: "POST",
        headers,
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to generate PDF report.");
      return res.blob();
    } else if (datasetId) {
      const res = await fetch(`${API_BASE}/exports/pdf/${datasetId}`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate PDF report.");
      return res.blob();
    }
    throw new Error("Either file or datasetId required.");
  },

  async saveMetadata(metadata: {
    name: string;
    original_filename: string;
    file_format: string;
    row_count: number;
    column_count: number;
    column_summary: any[];
  }): Promise<DatasetMetadata> {
    const headers = await getAuthHeaders();
    (headers as any)["Content-Type"] = "application/json";

    const res = await fetch(`${API_BASE}/datasets/save-metadata`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(metadata),
    });
    if (!res.ok) throw new Error("Failed to save metadata to Supabase.");
    return res.json();
  },

  async getSavedDatasets(): Promise<DatasetMetadata[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/datasets/saved`, {
      headers,
      credentials: "include",
    });
    if (!res.ok) return [];
    return res.json();
  },

  async deleteSavedDataset(id: string): Promise<boolean> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/datasets/saved/${id}`, {
      method: "DELETE",
      headers,
      credentials: "include",
    });
    return res.ok;
  },

  // -------------------------------------------------------------
  // Temporary Cloud Workspace Methods
  // -------------------------------------------------------------
  async initWorkspaceSession(tabId?: string): Promise<import("@/types").SessionStatus> {
    const url = tabId ? `${API_BASE}/session/initialize?tab_id=${encodeURIComponent(tabId)}` : `${API_BASE}/session/initialize`;
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to initialize workspace session.");
    return res.json();
  },

  async sendHeartbeat(tabId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/session/heartbeat`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tab_id: tabId }),
    });
    if (!res.ok) throw new Error("Heartbeat failed");
    return res.json();
  },

  async sendLeave(tabId: string): Promise<void> {
    try {
      const url = `${API_BASE}/session/leave`;
      const payload = JSON.stringify({ tab_id: tabId });
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}
  },

  async getSessionStatus(): Promise<import("@/types").SessionStatus> {
    const res = await fetch(`${API_BASE}/session`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch session status.");
    return res.json();
  },

  async recordActivity(): Promise<void> {
    await fetch(`${API_BASE}/session/activity`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
  },

  async uploadDataset(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/datasets/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Failed to upload dataset to temporary cloud storage.");
    }
    return res.json();
  },

  async listDatasets(): Promise<DatasetMetadata[]> {
    const res = await fetch(`${API_BASE}/datasets`, {
      credentials: "include",
    });
    if (!res.ok) return [];
    return res.json();
  },

  async getDatasetDetails(datasetId: string) {
    const res = await fetch(`${API_BASE}/datasets/${datasetId}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Dataset not found or session expired.");
    return res.json();
  },

  async downloadDatasetFile(datasetId: string): Promise<Blob> {
    const res = await fetch(`${API_BASE}/datasets/${datasetId}/file`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to download file from cloud storage.");
    return res.blob();
  },

  async deleteDataset(datasetId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/datasets/${datasetId}`, {
      method: "DELETE",
      credentials: "include",
    });
    return res.ok;
  },

  async listAnalyses(datasetId?: string): Promise<import("@/types").AnalysisRun[]> {
    const url = datasetId ? `${API_BASE}/analyses?dataset_id=${datasetId}` : `${API_BASE}/analyses`;
    const res = await fetch(url, {
      credentials: "include",
    });
    if (!res.ok) return [];
    return res.json();
  },

  async getAnalysisDetails(analysisId: string): Promise<import("@/types").AnalysisRun> {
    const res = await fetch(`${API_BASE}/analyses/${analysisId}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Analysis run not found.");
    return res.json();
  },
};

