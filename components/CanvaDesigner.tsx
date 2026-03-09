"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ExternalLink, CheckCircle2, AlertCircle, Loader2, Link2, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const CanvaDesigner = ({ onSave }: { onSave?: (url: string) => void }) => {
  const { user } = useAuth();
  const clientId = process.env.NEXT_PUBLIC_CANVA_CLIENT_ID;
  const [isLoaded, setIsLoaded] = useState(false);
  const [designUrl, setDesignUrl] = useState<string | null>(null);
  const [isDesigning, setIsDesigning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    setIsLoaded(true);
    
    const checkConnection = async () => {
      if (!user) return;
      try {
        const res = await fetch(`/api/auth/canva/status?userId=${user.id}`);
        const data = await res.json();
        setIsConnected(data.isConnected);
      } catch (err) {
        console.error("Error checking Canva connection:", err);
      } finally {
        setIsChecking(false);
      }
    };

    checkConnection();
  }, [user]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "CANVA_PUBLISH_SUCCESS") {
        // Refresh or handle success
        console.log("Canva publish success received via postMessage");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleDesignOnCanva = () => {
    if (!clientId) {
      alert("Please set your Canva Client ID in Profile Settings first.");
      return;
    }

    // Redirect to our login endpoint which handles PKCE and redirects to Canva
    window.location.href = "/api/auth/canva/login";
  };

  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm border border-stone-200 text-center max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ExternalLink className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900">Canva Integration</h2>
        <p className="text-stone-500 mt-2">
          Design your certificate template using Canva&apos;s powerful editor and import it directly as a background.
        </p>
      </div>

      {!clientId ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-left mb-6">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Canva Client ID Required</p>
            <p className="text-sm text-amber-700 mt-1">
              You need to provide your Canva Client ID in the Profile Settings to use this feature.
            </p>
          </div>
        </div>
      ) : isChecking ? (
        <div className="py-12 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Checking connection...</p>
        </div>
      ) : !isConnected ? (
        <div className="space-y-6">
          <div className="p-6 bg-stone-50 border border-stone-200 rounded-2xl text-center">
            <Link2 className="w-10 h-10 text-stone-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-stone-900">Connect to Canva</h3>
            <p className="text-sm text-stone-500 mt-1 mb-6">
              You need to authorize Certi Gen to access your Canva account to import designs.
            </p>
            <button
              onClick={handleDesignOnCanva}
              className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:bg-stone-800 shadow-xl shadow-stone-200"
            >
              <ExternalLink className="w-6 h-6" />
              <span>Connect Canva Account</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Canva Connected</p>
                <p className="text-xs text-emerald-700">Account linked successfully</p>
              </div>
            </div>
            <button 
              onClick={handleDesignOnCanva}
              className="text-xs font-bold text-emerald-700 hover:underline uppercase tracking-wider"
            >
              Reconnect
            </button>
          </div>

          {designUrl ? (
            <div className="relative group rounded-xl overflow-hidden border border-stone-200 shadow-lg">
              <Image 
                src={designUrl} 
                alt="Canva Design" 
                width={1200} 
                height={800} 
                className="w-full h-auto" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button 
                  onClick={() => window.open("https://www.canva.com", "_blank")}
                  className="px-4 py-2 bg-white text-stone-900 rounded-lg font-semibold text-sm hover:bg-stone-50 transition-colors"
                >
                  Open Canva
                </button>
                <button 
                  onClick={() => onSave?.(designUrl)}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-emerald-600 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save Template
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 border-2 border-dashed border-stone-200 rounded-[32px] flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400">
                <Palette className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-stone-900">No Template Selected</h3>
                <p className="text-sm text-stone-500 mt-1">
                  Go to Canva, create your design, and it will appear here.
                </p>
              </div>
              <button
                onClick={() => window.open("https://www.canva.com", "_blank")}
                className="mt-4 px-8 py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-200"
              >
                Go to Canva Editor
              </button>
            </div>
          )}
          
          <p className="text-xs text-stone-400">
            Your Canva designs are automatically synced. Make sure you use the same account.
          </p>
        </div>
      )}
    </div>
  );
};

export default CanvaDesigner;
