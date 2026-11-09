"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { AlertCircle, Loader2 } from "lucide-react";

export default function WarmupBanner() {
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const check = async () => {
      try {
        timeout = setTimeout(() => {
          setIsWarmingUp(true);
        }, 1500);

        await api.checkHealth();
        clearTimeout(timeout);
        setIsWarmingUp(false);
        setIsOnline(true);
      } catch (e) {
        clearTimeout(timeout);
        setIsWarmingUp(false);
        setIsOnline(false);
      }
    };

    check();
    return () => clearTimeout(timeout);
  }, []);

  if (isOnline === false) {
    return (
      <div className="bg-red-50 border-b border-red-200 text-red-900 px-4 py-2 text-xs flex items-center justify-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
        <span>Backend service is connecting or warming up. Please ensure FastAPI is running.</span>
      </div>
    );
  }

  if (isWarmingUp) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs flex items-center justify-center gap-2 animate-pulse">
        <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin shrink-0" />
        <span>Cloud container is initializing (~20-40s). Your workspace will be ready momentarily.</span>
      </div>
    );
  }

  return null;
}
