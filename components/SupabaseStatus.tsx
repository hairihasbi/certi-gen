"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Database, Wifi, WifiOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const SupabaseStatus = () => {
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkConnection = async () => {
      if (!supabase) {
        setStatus("disconnected");
        setError("Supabase credentials missing");
        return;
      }

      try {
        const fetchPromise = supabase
          .from("profiles")
          .select("id")
          .limit(1);
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout")), 15000)
        );

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
        
        if (error && error.code === "PGRST116") {
          setStatus("connected");
          setError(null);
        } else if (error) {
          console.error("Supabase connection error:", error);
          if (error.message.includes("fetch") || error.message.includes("Timeout")) {
             setStatus("disconnected");
             setError(error.message);
          } else {
             setStatus("connected");
             setError(null);
          }
        } else {
          setStatus("connected");
          setError(null);
        }
      } catch (err: any) {
        console.error("Supabase connection check failed:", err);
        setStatus("disconnected");
        setError(err.message || "Unknown error");
      }
    };

    checkConnection();
    interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRetry = () => {
    setStatus("connecting");
    setError(null);
    // The useEffect will trigger checkConnection via the interval or we can just reload
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
        status === "connected" ? "bg-emerald-100 text-emerald-700" : 
        status === "connecting" ? "bg-stone-100 text-stone-500" : 
        "bg-red-100 text-red-700"
      )}>
        {status === "connecting" ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : status === "connected" ? (
          <Wifi className="w-3 h-3" />
        ) : (
          <WifiOff className="w-3 h-3" />
        )}
        <span className="hidden sm:inline">
          {status === "connected" ? "Supabase Connected" : 
           status === "connecting" ? "Connecting..." : 
           "Supabase Offline"}
        </span>
      </div>
      {status === "disconnected" && (
        <button 
          onClick={handleRetry}
          className="text-[9px] text-red-600 hover:underline font-bold uppercase"
        >
          Retry Connection
        </button>
      )}
    </div>
  );
};
