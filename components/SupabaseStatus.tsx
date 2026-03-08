"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Database, Wifi, WifiOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const SupabaseStatus = () => {
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
          setTimeout(() => reject(new Error("Timeout")), 5000)
        );

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
        
        // Even if the table doesn't exist, if we get a response (even an error that isn't a network error), we're connected to the API
        if (error && error.code === "PGRST116") {
          // Table not found is fine, it means we reached the server
          setStatus("connected");
        } else if (error) {
          // Other errors might mean connection issues
          console.error("Supabase connection error:", error);
          // If it's a network error or similar
          if (error.message.includes("fetch")) {
             setStatus("disconnected");
          } else {
             setStatus("connected"); // Still connected to the service
          }
        } else {
          setStatus("connected");
        }
      } catch (err) {
        console.error("Supabase connection check failed:", err);
        setStatus("disconnected");
      }
    };

    checkConnection();

    // Set up a heartbeat or just rely on initial check for now
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
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
  );
};
