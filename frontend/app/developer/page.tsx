"use client";

import { useState, useEffect } from "react";
import { Terminal, Copy, Check, ExternalLink, ShieldCheck, Key, RefreshCw, Trash2, Clock, AlertTriangle } from "lucide-react";
import { api } from "@/lib/apiClient";

interface APIKeyItem {
  id: string;
  key_prefix: string;
  scopes: string[];
  status: string;
  created_at: string;
  expires_at: string;
}

export default function DeveloperPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeKeys, setActiveKeys] = useState<APIKeyItem[]>([]);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedGenerated, setCopiedGenerated] = useState(false);

  useEffect(() => {
    loadKeys();
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

  const sampleKeyDisplay = generatedKey || "dl_live_SAMPLE_TEMPORARY_KEY";

  const endpoints = [
    {
      method: "GET",
      path: "/api/v1/health",
      desc: "Returns API service health, active mode, and provider availability.",
      sample: "curl -X GET http://localhost:8000/api/v1/health",
    },
    {
      method: "POST",
      path: "/api/v1/datasets/preview",
      desc: "Uploads and evaluates CSV/XLSX/JSON in-memory, returning schema & preview.",
      sample: `curl -X POST http://localhost:8000/api/v1/datasets/preview \\\n  -H "Authorization: Bearer ${sampleKeyDisplay}" \\\n  -F "file=@sample.csv"`,
    },
    {
      method: "POST",
      path: "/api/v1/analytics/summary",
      desc: "Calculates descriptive statistics (mean, median, quartiles, IQR) in memory.",
      sample: `curl -X POST http://localhost:8000/api/v1/analytics/summary \\\n  -H "Authorization: Bearer ${sampleKeyDisplay}" \\\n  -F "file=@sales.xlsx"`,
    },
    {
      method: "POST",
      path: "/api/v1/insights/rules",
      desc: "Deterministic statistical heuristics (dominant categories, outliers, benchmarks).",
      sample: `curl -X POST http://localhost:8000/api/v1/insights/rules \\\n  -H "Authorization: Bearer ${sampleKeyDisplay}" \\\n  -F "file=@data.json"`,
    },
    {
      method: "POST",
      path: "/api/v1/exports/pdf",
      desc: "Generates and streams an executive PDF report built with ReportLab.",
      sample: `curl -X POST http://localhost:8000/api/v1/exports/pdf \\\n  -H "Authorization: Bearer ${sampleKeyDisplay}" \\\n  -F "file=@data.csv" --output report.pdf`,
    },
    {
      method: "GET",
      path: "/api/v1/datasets/saved",
      desc: "Lists saved dataset metadata scoped to the caller's anonymous identity.",
      sample: `curl -X GET http://localhost:8000/api/v1/datasets/saved \\\n  -H "Authorization: Bearer ${sampleKeyDisplay}"`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-text">Developer REST API & Temporary Keys</h1>
          <p className="text-sm text-text-muted mt-1">
            Generate separate, temporary Developer API Keys for external scripts, cURL, and tools.
          </p>
        </div>

        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="diwali-button-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 w-max"
        >
          <span>Open Swagger UI</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Temporary API Key Management Card */}
      <div className="diwali-card p-6 border border-gold/40 bg-gradient-to-br from-surface via-primary-light/10 to-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gold/20 flex items-center justify-center text-primary">
              <Key className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-text">Temporary Developer API Key</h3>
              <p className="text-xs text-text-muted">Expires after 30 minutes of inactivity • Displayed only once</p>
            </div>
          </div>

          <button
            onClick={handleGenerateKey}
            disabled={isGenerating}
            className="diwali-button-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 w-max"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            <span>Generate Temporary API Key</span>
          </button>
        </div>

        {/* Newly Generated Key Banner */}
        {generatedKey && (
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300 text-amber-950 mb-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Copy your Developer API Key now — it will never be displayed again:</span>
            </div>
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-surface border border-amber-200 font-mono text-xs text-text">
              <span className="truncate">{generatedKey}</span>
              <button
                onClick={() => handleCopyText(generatedKey, true)}
                className="diwali-button-primary px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                {copiedGenerated ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedGenerated ? "Copied" : "Copy Key"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Active Keys Table */}
        {activeKeys.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Active Keys</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-text-muted border-b border-border">
                  <tr>
                    <th className="py-2">Key Prefix</th>
                    <th className="py-2">Scopes</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Expires At</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activeKeys.map((k) => (
                    <tr key={k.id}>
                      <td className="py-2.5 font-mono font-semibold text-text">{k.key_prefix}</td>
                      <td className="py-2.5 text-text-muted">
                        <span className="diwali-badge-gold px-2 py-0.5 rounded text-[10px] font-semibold">
                          {k.scopes.join(", ")}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                          {k.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 text-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gold" />
                        <span>{new Date(k.expires_at).toLocaleTimeString()}</span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => handleRevokeKey(k.id)}
                          className="text-text-muted hover:text-maroon p-1 rounded"
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

      <div className="diwali-card p-4 bg-primary-light/30 border border-gold/30 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-text-muted leading-relaxed">
          <span className="font-bold text-text">Two-Tier Credential Architecture:</span> Browser requests automatically use an HttpOnly session cookie scoped to your browser profile. External tools use the separate Developer API Key via{" "}
          <code className="bg-surface px-1.5 py-0.5 rounded border border-border text-primary font-mono text-[11px]">
            Authorization: Bearer dl_live_...
          </code>. Both credentials expire after 30 minutes of inactivity and are stored strictly as SHA-256 hashes.
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {endpoints.map((ep, idx) => (
          <div key={ep.path} className="diwali-card p-5 flex flex-col gap-3">
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
                <span className="font-mono text-sm font-semibold text-text">{ep.path}</span>
              </div>
              <p className="text-xs text-text-muted">{ep.desc}</p>
            </div>

            <div className="relative bg-[#1E1B18] text-[#F3EFE6] p-3.5 rounded-xl font-mono text-xs overflow-x-auto">
              <pre className="whitespace-pre">{ep.sample}</pre>
              <button
                onClick={() => handleCopyText(ep.sample, false, idx)}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-surface/10 hover:bg-surface/20 text-[#F3EFE6] transition-colors"
                title="Copy snippet"
              >
                {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
