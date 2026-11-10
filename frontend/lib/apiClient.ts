import { getOrCreateAnonymousSession } from "./supabaseClient";
import {
  DatasetPreviewResponse,
  AnalyticsSummaryResponse,
  ChartDataResponse,
  RuleInsightsResponse,
  DatasetMetadata,
} from "@/types";

export function getApiBase(): string {
  // If running in browser on ANY remote host (Vercel, custom domain):
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";
    if (!isLocal) {
      // If NEXT_PUBLIC_API_BASE_URL is explicitly configured to a valid remote URL, use it:
      const configured = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (configured && !configured.includes("localhost") && !configured.includes("127.0.0.1")) {
        return configured;
      }
      return "https://sochiq-backend.onrender.com/api/v1";
    }
  }

  // Local development fallback:
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
}



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
    const res = await fetch(`${getApiBase()}/auth/session`, {
      method: "POST",
      credentials: "include", // Ensures HttpOnly cookie is saved by browser
    });
    if (!res.ok) throw new Error("Failed to initialize browser session.");
    return res.json();
  },

  async logoutBrowserSession() {
    const res = await fetch(`${getApiBase()}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  },

  async generateDeveloperAPIKey(scopes?: string[]) {
    const res = await fetch(`${getApiBase()}/auth/keys/generate`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scopes }),
    });
    if (!res.ok) throw new Error("Failed to generate Developer API Key.");
    return res.json();
  },

  async listDeveloperAPIKeys() {
    const res = await fetch(`${getApiBase()}/auth/keys`, {
      credentials: "include",
    });
    if (!res.ok) return [];
    return res.json();
  },

  async revokeDeveloperAPIKey(keyId: string) {
    const res = await fetch(`${getApiBase()}/auth/keys/${keyId}`, {
      method: "DELETE",
      credentials: "include",
    });
    return res.ok;
  },
  async checkHealth() {
    const res = await fetch(`${getApiBase()}/health`);
    if (!res.ok) throw new Error("Backend service unreachable");
    return res.json();
  },

  async previewDataset(file: File): Promise<DatasetPreviewResponse> {
    const headers = await getAuthHeaders();
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${getApiBase()}/datasets/preview`, {
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

    const res = await fetch(`${getApiBase()}/analytics/summary`, {
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

    const res = await fetch(`${getApiBase()}/analytics/chart-data`, {
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

    const res = await fetch(`${getApiBase()}/insights/rules`, {
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

    const res = await fetch(`${getApiBase()}/ai/query`, {
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
      const res = await fetch(`${getApiBase()}/exports/csv`, {
        method: "POST",
        headers,
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to generate clean CSV.");
      return res.blob();
    } else if (datasetId) {
      const res = await fetch(`${getApiBase()}/exports/csv/${datasetId}`, {
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
      const res = await fetch(`${getApiBase()}/exports/pdf`, {
        method: "POST",
        headers,
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to generate PDF report.");
      return res.blob();
    } else if (datasetId) {
      const res = await fetch(`${getApiBase()}/exports/pdf/${datasetId}`, {
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

    const res = await fetch(`${getApiBase()}/datasets/save-metadata`, {
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
    const res = await fetch(`${getApiBase()}/datasets/saved`, {
      headers,
      credentials: "include",
    });
    if (!res.ok) return [];
    return res.json();
  },

  async deleteSavedDataset(id: string): Promise<boolean> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${getApiBase()}/datasets/saved/${id}`, {
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
    const url = tabId ? `${getApiBase()}/session/initialize?tab_id=${encodeURIComponent(tabId)}` : `${getApiBase()}/session/initialize`;
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to initialize workspace session.");
    return res.json();
  },

  async sendHeartbeat(tabId: string): Promise<any> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${getApiBase()}/session/heartbeat`, {
      method: "POST",
      credentials: "include",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ tab_id: tabId }),
    });
    if (!res.ok) throw new Error("Heartbeat failed");
    return res.json();
  },

  async sendLeave(tabId: string): Promise<void> {
    try {
      const url = `${getApiBase()}/session/leave`;
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
    const res = await fetch(`${getApiBase()}/session`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch session status.");
    return res.json();
  },

  async recordActivity(): Promise<void> {
    await fetch(`${getApiBase()}/session/activity`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
  },

  async uploadDataset(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${getApiBase()}/datasets/upload`, {
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
    const res = await fetch(`${getApiBase()}/datasets`, {
      credentials: "include",
    });
    if (!res.ok) return [];
    return res.json();
  },

  async getDatasetDetails(datasetId: string) {
    const res = await fetch(`${getApiBase()}/datasets/${datasetId}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Dataset not found or session expired.");
    return res.json();
  },

  async downloadDatasetFile(datasetId: string): Promise<Blob> {
    const res = await fetch(`${getApiBase()}/datasets/${datasetId}/file`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to download file from cloud storage.");
    return res.blob();
  },

  async deleteDataset(datasetId: string): Promise<boolean> {
    const res = await fetch(`${getApiBase()}/datasets/${datasetId}`, {
      method: "DELETE",
      credentials: "include",
    });
    return res.ok;
  },

  async listAnalyses(datasetId?: string): Promise<import("@/types").AnalysisRun[]> {
    const url = datasetId ? `${getApiBase()}/analyses?dataset_id=${datasetId}` : `${getApiBase()}/analyses`;
    const res = await fetch(url, {
      credentials: "include",
    });
    if (!res.ok) return [];
    return res.json();
  },

  async getAnalysisDetails(analysisId: string): Promise<import("@/types").AnalysisRun> {
    const res = await fetch(`${getApiBase()}/analyses/${analysisId}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Analysis run not found.");
    return res.json();
  },
};

