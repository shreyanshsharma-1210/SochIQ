"use client";

import { useState, useRef } from "react";
import { UploadCloud, AlertCircle, Loader2 } from "lucide-react";

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
}

export default function UploadDropzone({ onFileSelected, isLoading }: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls", "json"].includes(ext || "")) {
      setError("Unsupported format. Please upload CSV (.csv), Excel (.xlsx), or JSON (.json).");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("File exceeds maximum upload limit of 25 MB.");
      return;
    }
    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-10 sm:p-14 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
          isDragOver
            ? "border-yellow bg-yellow/10 scale-[1.01]"
            : "border-grey-border hover:border-charcoal bg-white shadow-card hover:shadow-card-hover"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          accept=".csv,.xlsx,.xls,.json"
          className="hidden"
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-charcoal animate-spin" />
            <p className="font-heading font-bold text-sm text-charcoal">
              Processing dataset in memory...
            </p>
            <p className="text-xs text-grey-muted">
              Computing statistics, quality audits, and chart series.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-yellow/20 flex items-center justify-center text-charcoal mb-1">
              <UploadCloud className="w-8 h-8 text-charcoal" />
            </div>
            <div>
              <p className="font-heading text-lg font-bold text-charcoal">
                Drag & drop your dataset here
              </p>
              <p className="text-xs text-grey-muted mt-1">
                or click to browse from your device
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-grey-subtle border border-grey-border text-charcoal">
                CSV
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-grey-subtle border border-grey-border text-charcoal">
                Excel (.xlsx)
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-grey-subtle border border-grey-border text-charcoal">
                JSON
              </span>
              <span className="text-[11px] text-grey-muted ml-1">Up to 25 MB</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
