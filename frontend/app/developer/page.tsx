"use client";

import { Terminal, Copy, Check, ExternalLink, ShieldCheck } from "lucide-react";
import { useState } from "react";

export default function DeveloperPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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
      sample: 'curl -X POST http://localhost:8000/api/v1/datasets/preview \\\n  -H "Authorization: Bearer <ANON_JWT>" \\\n  -F "file=@sample.csv"',
    },
    {
      method: "POST",
      path: "/api/v1/analytics/summary",
      desc: "Calculates descriptive statistics (mean, median, quartiles, IQR) in memory.",
      sample: 'curl -X POST http://localhost:8000/api/v1/analytics/summary \\\n  -F "file=@sales.xlsx"',
    },
    {
      method: "POST",
      path: "/api/v1/insights/rules",
      desc: "Deterministic statistical heuristics (dominant categories, outliers, benchmarks).",
      sample: 'curl -X POST http://localhost:8000/api/v1/insights/rules \\\n  -F "file=@data.json"',
    },
    {
      method: "POST",
      path: "/api/v1/exports/pdf",
      desc: "Generates and streams an executive PDF report built with ReportLab.",
      sample: 'curl -X POST http://localhost:8000/api/v1/exports/pdf \\\n  -F "file=@data.csv" --output report.pdf',
    },
    {
      method: "GET",
      path: "/api/v1/datasets/saved",
      desc: "Lists saved dataset metadata scoped to the caller's anonymous identity.",
      sample: 'curl -X GET http://localhost:8000/api/v1/datasets/saved \\\n  -H "Authorization: Bearer <ANON_JWT>"',
    },
  ];

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-text">Developer REST API</h1>
          <p className="text-sm text-text-muted mt-1">
            Programmatic access to in-memory tabular analytics, quality inspection, and PDF reporting.
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

      <div className="diwali-card p-4 bg-primary-light/30 border border-gold/30 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-text-muted leading-relaxed">
          <span className="font-bold text-text">Anonymous Authentication:</span> Endpoints accept Supabase Anonymous JWTs in the{" "}
          <code className="bg-surface px-1.5 py-0.5 rounded border border-border text-primary font-mono text-[11px]">
            Authorization: Bearer &lt;TOKEN&gt;
          </code>{" "}
          header. When interacting locally without auth tokens, a default local anonymous session is applied.
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
                onClick={() => handleCopy(ep.sample, idx)}
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

