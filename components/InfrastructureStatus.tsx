"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface StatusItemProps {
  label: string;
  check: () => Promise<boolean>;
  interval?: number;
}

const StatusItem = ({ label, check, interval = 30000 }: StatusItemProps) => {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    const performCheck = async () => {
      try {
        const isOnline = await check();
        setStatus(isOnline ? "online" : "offline");
      } catch {
        setStatus("offline");
      }
    };

    performCheck();
    const id = setInterval(performCheck, interval);
    return () => clearInterval(id);
  }, [check, interval]);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-2 h-2 rounded-full transition-all duration-500",
          status === "checking" && "bg-stone-300 animate-pulse",
          status === "online" && "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
          status === "offline" && "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
        )} />
        <span className="text-xs font-semibold text-stone-600">{label}</span>
      </div>
      <span className={cn(
        "text-[10px] font-bold uppercase transition-colors duration-500",
        status === "checking" && "text-stone-400",
        status === "online" && "text-emerald-600",
        status === "offline" && "text-rose-600"
      )}>
        {status === "checking" ? "Checking..." : status === "online" ? (label === "Hashing Service" ? "Operational" : "Connected") : "Disconnected"}
      </span>
    </div>
  );
};

export const InfrastructureStatus = ({ onStatusChange }: { onStatusChange?: (status: boolean) => void }) => {
  const [dbOk, setDbOk] = useState(true);

  const checkSupabase = async () => {
    if (!supabase) {
      setDbOk(false);
      onStatusChange?.(false);
      return false;
    }
    
    try {
      const fetchPromise = supabase
        .from("templates")
        .select("id")
        .limit(1);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 60000)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      
      if (error) {
        // PGRST116 is "no rows", which is fine. 
        // 42P01 is "relation does not exist" (table missing)
        if (error.code === "42P01") {
          setDbOk(false);
          onStatusChange?.(false);
          return false;
        }
        if (error.message.includes("fetch")) {
          setDbOk(false);
          onStatusChange?.(false);
          return false;
        }
      }
      
      setDbOk(true);
      onStatusChange?.(true);
      return true;
    } catch {
      setDbOk(false);
      onStatusChange?.(false);
      return false;
    }
  };

  const checkCanva = async () => {
    // Check if Canva Client ID is configured
    return !!process.env.NEXT_PUBLIC_CANVA_CLIENT_ID;
  };

  const checkHashing = async () => {
    // Check if Web Crypto API is available
    return typeof window !== "undefined" && !!window.crypto && !!window.crypto.subtle;
  };

  return (
    <div className="space-y-5">
      <StatusItem label="Database Engine" check={checkSupabase} />
      <StatusItem label="Canva API Gateway" check={checkCanva} />
      <StatusItem label="Hashing Service" check={checkHashing} />
    </div>
  );
};
