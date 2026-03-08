"use client";

import React, { useState, useEffect } from "react";
import { Settings, Key, Save, CheckCircle2, Info, Mail, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealtimeData } from "@/hooks/useRealtimeData";

const ProfileSettings = () => {
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
    const { error } = await saveSetting("email_config", config);
    if (!error) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } else {
      console.error("Error saving config:", error);
    }
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
          <div className="text-sm text-blue-800">
            <p className="font-semibold">Canva Integration Status</p>
            <div className="mt-2 flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                process.env.NEXT_PUBLIC_CANVA_CLIENT_ID ? "bg-emerald-500" : "bg-amber-500"
              )} />
              <span className="font-medium">
                {process.env.NEXT_PUBLIC_CANVA_CLIENT_ID ? "Active (Managed by Admin)" : "Inactive (Contact Admin)"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-stone-900 font-bold border-b border-stone-100 pb-2">
            <Mail className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wider">Email Configuration (SMTP)</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase">SMTP Host</label>
              <input 
                type="text" 
                value={config.smtpHost}
                onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all outline-none text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase">SMTP Port</label>
              <input 
                type="text" 
                value={config.smtpPort}
                onChange={(e) => setConfig({ ...config, smtpPort: e.target.value })}
                placeholder="465"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all outline-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase">SMTP User</label>
            <input 
              type="text" 
              value={config.smtpUser}
              onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
              placeholder="your-email@gmail.com"
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all outline-none text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase">SMTP Password</label>
            <input 
              type="password" 
              value={config.smtpPass}
              onChange={(e) => setConfig({ ...config, smtpPass: e.target.value })}
              placeholder="••••••••••••"
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase">From Email</label>
              <input 
                type="email" 
                value={config.fromEmail}
                onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                placeholder="no-reply@certigen.my.id"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all outline-none text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase">From Name</label>
              <input 
                type="text" 
                value={config.fromName}
                onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                placeholder="Certi Gen"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all outline-none text-sm"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
            isSaved 
              ? "bg-emerald-500 text-white" 
              : "bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-200 disabled:opacity-50"
          )}
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isSaved ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Settings Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;
