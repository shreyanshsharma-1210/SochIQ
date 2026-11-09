"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, AlertCircle, Loader2 } from "lucide-react";

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
        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
          isDragOver
            ? "border-saffron bg-saffron-light/40 shadow-diwali-glow scale-[1.01]"
            : "border-border hover:border-gold bg-surface hover:shadow-diwali"
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
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="font-semibold text-text">Processing dataset in memory...</p>
            <p className="text-xs text-text-muted">Computing statistics, quality audits, and chart series.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center text-primary mb-1">
              <UploadCloud className="w-8 h-8 text-gold" />
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-text">Drag & drop your dataset here</p>
              <p className="text-sm text-text-muted mt-1">or click to browse from your device</p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md diwali-badge-gold">CSV</span>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md diwali-badge-gold">Excel (.xlsx)</span>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md diwali-badge-gold">JSON</span>
              <span className="text-[11px] text-text-muted ml-1">Up to 25 MB</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-maroon-light border border-maroon text-maroon text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

