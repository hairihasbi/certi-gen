"use client";

import React, { useState, useEffect } from "react";
import { Settings, Key, Save, CheckCircle2, Info, Mail, Loader2, Palette, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

const ProfileSettings = () => {
  const { user } = useAuth();
  const { saveSetting, fetchSetting } = useRealtimeData();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState({
    smtpHost: "",
    smtpPort: "465",
    smtpUser: "",
    smtpPass: "",
    fromEmail: "",
    fromName: "Certi Gen",
  });

  useEffect(() => {
    const loadConfig = async () => {
      setIsLoading(true);
      const { data } = await fetchSetting("email_config");
      if (data?.value) {
        setConfig(data.value);
      }
      setIsLoading(false);
    };
    loadConfig();
  }, [fetchSetting]);

  const handleSave = async () => {
    setIsSaving(true);
    // Email config removed as per user request
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-stone-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-sm border border-stone-200">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-stone-100 rounded-lg">
          <Settings className="w-6 h-6 text-stone-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-stone-900">Profile Settings</h2>
          <p className="text-sm text-stone-500">Manage your integrations and credentials</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 flex-1">
            <p className="font-semibold">Canva Integration Status</p>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  process.env.NEXT_PUBLIC_CANVA_CLIENT_ID ? "bg-emerald-500" : "bg-amber-500"
                )} />
                <span className="font-medium">
                  {process.env.NEXT_PUBLIC_CANVA_CLIENT_ID ? "Active (Managed by Admin)" : "Inactive (Contact Admin)"}
                </span>
              </div>
              {user?.role === "admin" && (
                <Link 
                  href="/dashboard/admin/canva"
                  className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:underline flex items-center gap-1"
                >
                  Config <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 border-2 border-dashed border-stone-100 rounded-3xl text-center">
          <Palette className="w-10 h-10 text-stone-200 mx-auto mb-4" />
          <p className="text-sm text-stone-400 font-medium">More settings coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
