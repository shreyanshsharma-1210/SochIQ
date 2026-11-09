"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

export default function WarmupBanner() {
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  const check = async () => {
    let timeout: NodeJS.Timeout | null = null;
    try {
      // Only show warmup notice if backend genuinely takes longer than 6 seconds (cold start)
      timeout = setTimeout(() => {
        setIsWarmingUp(true);
      }, 6000);

      await api.checkHealth();
      if (timeout) clearTimeout(timeout);
      setIsWarmingUp(false);
      setIsOnline(true);
    } catch (e) {
      if (timeout) clearTimeout(timeout);
      setIsWarmingUp(false);
      setIsOnline(false);
    }
  };

  useEffect(() => {
    check();
  }, []);

  if (isOnline === false) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 text-charcoal px-4 py-2 text-xs flex items-center justify-center gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Backend service is connecting. Offline mode active.</span>
        <button
          onClick={check}
          className="ml-2 inline-flex items-center gap-1 font-semibold text-charcoal underline hover:no-underline cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (isWarmingUp) {
    return (
      <div className="bg-yellow/15 border-b border-yellow/40 text-charcoal px-4 py-2 text-xs flex items-center justify-center gap-2">
        <Loader2 className="w-3.5 h-3.5 text-charcoal animate-spin shrink-0" />
        <span className="font-medium">
          Warming up cloud services. Application shell and navigation remain fully responsive.
        </span>
      </div>
    );
  }

  return null;
}
