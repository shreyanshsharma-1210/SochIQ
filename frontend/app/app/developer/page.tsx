"use client";

import { useState, useEffect } from "react";
import { Terminal, Copy, Check, ExternalLink, ShieldCheck, Key, RefreshCw, Trash2, Clock, AlertTriangle, Code2 } from "lucide-react";
import { api } from "@/lib/apiClient";

interface APIKeyItem {
  id: string;
  key_prefix: string;
  scopes: string[];
  status: string;
  created_at: string;
  expires_at: string;
}

export default function AppDeveloperPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeKeys, setActiveKeys] = useState<APIKeyItem[]>([]);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedGenerated, setCopiedGenerated] = useState(false);
  const [envMode, setEnvMode] = useState<"live" | "local">("live");

  const baseUrl = envMode === "live" ? "https://sochiq-backend.onrender.com" : "http://localhost:8000";

  useEffect(() => {
    const setup = async () => {
      try {
        await api.initBrowserSession();
      } catch (e) {
        // session might already exist
      }
      loadKeys();
    };
    setup();
  }, []);

  const loadKeys = async () => {
    try {
      const keys = await api.listDeveloperAPIKeys();
      setActiveKeys(keys);
    } catch (e) {
      console.warn("Failed to load keys:", e);
    }
  };

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    try {
      try {
        await api.initBrowserSession();
      } catch (e) {
        // proceed
      }
      const res = await api.generateDeveloperAPIKey();
      setGeneratedKey(res.api_key); // ONLY displayed once
      loadKeys();
    } catch (e: any) {
      alert(e.message || "Failed to generate key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (confirm("Revoke this Developer API key immediately?")) {
      await api.revokeDeveloperAPIKey(id);
      loadKeys();
    }
  };

  const handleCopyText = (text: string, isGen: boolean = false, idx?: number) => {
    navigator.clipboard.writeText(text);
    if (isGen) {
      setCopiedGenerated(true);
      setTimeout(() => setCopiedGenerated(false), 2000);
    } else if (idx !== undefined) {
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const sampleKeyDisplay = generatedKey || "sochiq_live_SAMPLE_TEMPORARY_KEY";

  const endpoints = [
    {
      method: "GET",
      path: "/api/v1/health",
      desc: "Returns API service health, active mode, and provider availability.",
      sample: `curl -X GET ${baseUrl}/api/v1/health`,
    },
    {
      method: "POST",
      path: "/api/v1/datasets/preview",
      desc: "Uploads and evaluates CSV/XLSX/JSON in-memory, returning schema & preview.",
      sample: `curl -X POST ${baseUrl}/api/v1/datasets/preview \\\n  -H "Authorization: Bearer ${sampleKeyDisplay}" \\\n  -F "file=@sample.csv"`,
    },
    {
      method: "POST",
      path: "/api/v1/analytics/summary",
      desc: "Calculates descriptive statistics (mean, median, quartiles, IQR) in memory.",
      sample: `curl -X POST ${baseUrl}/api/v1/analytics/summary \\\n  -H "Authorization: Bearer ${sampleKeyDisplay}" \\\n  -F "file=@sales.xlsx"`,
    },
    {
      method: "POST",
      path: "/api/v1/insights/rules",
      desc: "Deterministic statistical heuristics (dominant categories, outliers, benchmarks).",
      sample: `curl -X POST ${baseUrl}/api/v1/insights/rules \\\n  -H "Authorization: Bearer ${sampleKeyDisplay}" \\\n  -F "file=@data.json"`,
    },
    {
      method: "POST",
      path: "/api/v1/exports/pdf",
      desc: "Generates and streams an executive PDF report built with ReportLab.",
      sample: `curl -X POST ${baseUrl}/api/v1/exports/pdf \\\n  -H "Authorization: Bearer ${sampleKeyDisplay}" \\\n  -F "file=@data.csv" --output SochIQ_Report.pdf`,
    },
    {
      method: "GET",
      path: "/api/v1/datasets/saved",
      desc: "Lists saved dataset metadata scoped to caller's anonymous identity.",
      sample: `curl -X GET ${baseUrl}/api/v1/datasets/saved \\\n  -H "Authorization: Bearer ${sampleKeyDisplay}"`,
    },
    {
      method: "POST",
      path: "/api/v1/ai/query",
      desc: "Inquires analytical summaries and trends grounded on computed statistics via Groq.",
      sample: `curl -X POST ${baseUrl}/api/v1/ai/query \\\n  -H "Authorization: Bearer ${sampleKeyDisplay}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"question": "Summarize key dataset dimensions", "summary_context": {}}'`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">
            Developer REST API & Temporary Keys
          </h1>
          <p className="text-xs sm:text-sm text-grey-muted mt-1">
            Generate separate, temporary Developer API Keys for external scripts, cURL, and tools.
          </p>
        </div>

        {/* Environment Switcher & Swagger Documentation Link */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-grey-border shadow-2xs">
            <button
              type="button"
              onClick={() => setEnvMode("live")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                envMode === "live"
                  ? "bg-charcoal text-white shadow-xs"
                  : "text-grey-muted hover:text-charcoal"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Cloud</span>
            </button>
            <button
              type="button"
              onClick={() => setEnvMode("local")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                envMode === "local"
                  ? "bg-charcoal text-white shadow-xs"
                  : "text-grey-muted hover:text-charcoal"
              }`}
            >
              <span>Localhost</span>
            </button>
          </div>

          <a
            href={`${baseUrl}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-charcoal text-white text-xs font-semibold hover:bg-charcoal-deep transition-all shadow-xs w-max cursor-pointer"
          >
            <span>Open Swagger UI</span>
            <ExternalLink className="w-3.5 h-3.5 text-yellow" />
          </a>
        </div>
      </div>

      {/* Temporary API Key Management Card */}
      <div className="sochiq-card p-6 bg-white border border-grey-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow/20 flex items-center justify-center text-charcoal shrink-0">
              <Key className="w-5 h-5 text-charcoal" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-bold text-charcoal">
                Temporary Developer API Key
              </h3>
              <p className="text-xs text-grey-muted">
                Scoped to workspace lifecycle • Displayed only once
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateKey}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-charcoal text-white text-xs font-semibold hover:bg-charcoal-deep transition-all shadow-xs w-max"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-yellow ${isGenerating ? "animate-spin" : ""}`} />
            <span>Generate Temporary API Key</span>
          </button>
        </div>

        {/* Newly Generated Key Banner */}
        {generatedKey && (
          <div className="p-4 rounded-xl bg-yellow/15 border border-yellow/60 text-charcoal mb-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-charcoal">
              <AlertTriangle className="w-4 h-4 text-charcoal shrink-0" />
              <span>Copy your Developer API Key now — it will never be displayed again:</span>
            </div>
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-yellow font-mono text-xs text-charcoal">
              <span className="truncate">{generatedKey}</span>
              <button
                onClick={() => handleCopyText(generatedKey, true)}
                className="px-3 py-1 rounded-md bg-charcoal text-white text-xs font-semibold flex items-center gap-1 shrink-0 hover:bg-charcoal-deep transition-colors"
              >
                {copiedGenerated ? <Check className="w-3.5 h-3.5 text-yellow" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedGenerated ? "Copied" : "Copy Key"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Active Keys Table */}
        {activeKeys.length > 0 && (
          <div className="mt-4 pt-4 border-t border-grey-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-grey-muted mb-2">
              Active Keys
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-grey-muted border-b border-grey-border font-semibold">
                  <tr>
                    <th className="py-2">Key Prefix</th>
                    <th className="py-2">Scopes</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Expires At</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-grey-border">
                  {activeKeys.map((k) => (
                    <tr key={k.id}>
                      <td className="py-2.5 font-mono font-semibold text-charcoal">{k.key_prefix}</td>
                      <td className="py-2.5 text-grey-muted">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-grey-subtle text-charcoal border border-grey-border">
                          {k.scopes.join(", ")}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          {k.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 text-grey-muted flex items-center gap-1">
                        <Clock className="w-3 h-3 text-grey-muted" />
                        <span>{new Date(k.expires_at).toLocaleTimeString()}</span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => handleRevokeKey(k.id)}
                          className="text-grey-muted hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Revoke key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Security Architecture Note */}
      <div className="sochiq-card p-4 bg-white border border-grey-border flex items-start gap-3 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-grey-muted leading-relaxed">
          <span className="font-bold text-charcoal">Two-Tier Credential Architecture:</span> Browser requests automatically use an HttpOnly session cookie scoped to your browser profile. External tools use the separate Developer API Key via{" "}
          <code className="bg-grey-subtle px-1.5 py-0.5 rounded border border-grey-border text-charcoal font-mono text-[11px]">
            Authorization: Bearer dl_live_...
          </code>. Both credentials remain active while your workspace is open, and are stored strictly as SHA-256 hashes in Supabase PostgreSQL.
        </div>
      </div>

      {/* API Endpoints */}
      <div className="flex flex-col gap-4">
        <h3 className="font-heading text-sm font-bold text-charcoal uppercase tracking-wider">
          API Endpoint Reference
        </h3>
        {endpoints.map((ep, idx) => (
          <div key={ep.path} className="sochiq-card p-5 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    ep.method === "GET"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {ep.method}
                </span>
                <span className="font-mono text-sm font-semibold text-charcoal">{ep.path}</span>
              </div>
              <p className="text-xs text-grey-muted">{ep.desc}</p>
            </div>

            <div className="relative bg-charcoal text-white p-3.5 rounded-xl font-mono text-xs overflow-x-auto border border-charcoal-deep">
              <pre className="whitespace-pre">{ep.sample}</pre>
              <button
                onClick={() => handleCopyText(ep.sample, false, idx)}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Copy snippet"
              >
                {copiedIndex === idx ? (
                  <Check className="w-3.5 h-3.5 text-yellow" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
