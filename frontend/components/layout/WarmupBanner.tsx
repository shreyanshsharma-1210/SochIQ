"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { AlertCircle, CheckCircle2 } from "lucide-react";

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
      <div className="bg-maroon-light border-b border-maroon text-maroon px-4 py-2 text-xs flex items-center justify-center gap-2">
        <AlertCircle className="w-4 h-4" />
        <span>Backend service is currently connecting or warming up. Please ensure FastAPI is running.</span>
      </div>
    );
  }

  if (isWarmingUp) {
    return (
      <div className="bg-saffron-light border-b border-saffron text-amber-900 px-4 py-2 text-xs flex items-center justify-center gap-2 animate-pulse">
        <div className="w-2 h-2 rounded-full bg-saffron animate-ping" />
        <span>Render cloud container is spinning up from cold-start (~30-50s). Hang tight!</span>
      </div>
    );
  }

  return null;
}

