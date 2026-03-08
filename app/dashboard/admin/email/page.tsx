"use client";

import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Save, 
  ArrowLeft, 
  Send, 
  Settings, 
  ShieldCheck, 
  Info,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type Provider = "mailersend" | "brevo" | "smtp";

interface EmailSettings {
  provider: Provider;
  mailersend: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  brevo: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
    fromEmail: string;
    fromName: string;
    secure: boolean;
  };
}

const DEFAULT_SETTINGS: EmailSettings = {
  provider: "mailersend",
  mailersend: {
    apiKey: "",
    fromEmail: "",
    fromName: "CertiGen Admin",
  },
  brevo: {
    apiKey: "",
    fromEmail: "",
    fromName: "CertiGen Admin",
  },
  smtp: {
    host: "",
    port: 587,
    user: "",
    pass: "",
    fromEmail: "",
    fromName: "CertiGen Admin",
    secure: false,
  },
};

export default function EmailSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<EmailSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("id", "email_config")
        .single();
      
      if (data) {
        setSettings(data.value as EmailSettings);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!supabase) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("settings")
        .upsert({ id: "email_config", value: settings, updated_at: new Date().toISOString() });

      if (error) throw error;
      setMessage({ type: "success", text: "Konfigurasi email berhasil disimpan." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Gagal menyimpan konfigurasi." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      setMessage({ type: "error", text: "Masukkan email tujuan untuk testing." });
      return;
    }
    setIsTesting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail, settings }),
      });

      const result = await response.json();
      if (result.success) {
        setMessage({ type: "success", text: "Email percobaan berhasil dikirim!" });
      } else {
        throw new Error(result.error || "Gagal mengirim email percobaan.");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-stone-50 p-6 lg:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-900 border border-stone-200 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Email Settings</h1>
              <p className="text-stone-500 text-sm">Konfigurasi MailerSend, Brevo, atau SMTP untuk pengiriman sertifikat.</p>
            </div>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Perubahan
          </button>
        </div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mb-8 p-4 rounded-2xl flex items-center gap-3 border",
              message.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"
            )}
          >
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{message.text}</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Provider Selection */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">Pilih Provider</h3>
            {(["mailersend", "brevo", "smtp"] as Provider[]).map((p) => (
              <button
                key={p}
                onClick={() => setSettings({ ...settings, provider: p })}
                className={cn(
                  "w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group",
                  settings.provider === p 
                    ? "bg-stone-900 border-stone-900 text-white shadow-lg" 
                    : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    settings.provider === p ? "bg-white/10" : "bg-stone-50"
                  )}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold capitalize">{p}</span>
                </div>
                {settings.provider === p && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
              </button>
            ))}

            <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl mt-8">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                  Pastikan domain pengirim sudah terverifikasi di provider yang Anda pilih agar email tidak masuk ke folder spam.
                </p>
              </div>
            </div>
          </div>

          {/* Configuration Form */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-stone-100">
                <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-stone-900">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 capitalize">{settings.provider} Configuration</h3>
                  <p className="text-xs text-stone-400">Masukkan detail API atau SMTP Anda.</p>
                </div>
              </div>

              {settings.provider === "mailersend" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">API Key</label>
                    <input 
                      type="password"
                      value={settings.mailersend.apiKey}
                      onChange={(e) => setSettings({ ...settings, mailersend: { ...settings.mailersend, apiKey: e.target.value } })}
                      placeholder="mlsn.at.xxxxxxxxxxxx"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">From Email</label>
                      <input 
                        type="email"
                        value={settings.mailersend.fromEmail}
                        onChange={(e) => setSettings({ ...settings, mailersend: { ...settings.mailersend, fromEmail: e.target.value } })}
                        placeholder="no-reply@domain.com"
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">From Name</label>
                      <input 
                        type="text"
                        value={settings.mailersend.fromName}
                        onChange={(e) => setSettings({ ...settings, mailersend: { ...settings.mailersend, fromName: e.target.value } })}
                        placeholder="CertiGen Admin"
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {settings.provider === "brevo" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">API Key (v3)</label>
                    <input 
                      type="password"
                      value={settings.brevo.apiKey}
                      onChange={(e) => setSettings({ ...settings, brevo: { ...settings.brevo, apiKey: e.target.value } })}
                      placeholder="xkeysib-xxxxxxxxxxxx"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">From Email</label>
                      <input 
                        type="email"
                        value={settings.brevo.fromEmail}
                        onChange={(e) => setSettings({ ...settings, brevo: { ...settings.brevo, fromEmail: e.target.value } })}
                        placeholder="admin@domain.com"
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">From Name</label>
                      <input 
                        type="text"
                        value={settings.brevo.fromName}
                        onChange={(e) => setSettings({ ...settings, brevo: { ...settings.brevo, fromName: e.target.value } })}
                        placeholder="CertiGen Admin"
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {settings.provider === "smtp" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">Host</label>
                      <input 
                        type="text"
                        value={settings.smtp.host}
                        onChange={(e) => setSettings({ ...settings, smtp: { ...settings.smtp, host: e.target.value } })}
                        placeholder="smtp.gmail.com"
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">Port</label>
                      <input 
                        type="number"
                        value={settings.smtp.port}
                        onChange={(e) => setSettings({ ...settings, smtp: { ...settings.smtp, port: parseInt(e.target.value) } })}
                        placeholder="587"
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">User</label>
                      <input 
                        type="text"
                        value={settings.smtp.user}
                        onChange={(e) => setSettings({ ...settings, smtp: { ...settings.smtp, user: e.target.value } })}
                        placeholder="user@gmail.com"
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">Password</label>
                      <input 
                        type="password"
                        value={settings.smtp.pass}
                        onChange={(e) => setSettings({ ...settings, smtp: { ...settings.smtp, pass: e.target.value } })}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">From Email</label>
                      <input 
                        type="email"
                        value={settings.smtp.fromEmail}
                        onChange={(e) => setSettings({ ...settings, smtp: { ...settings.smtp, fromEmail: e.target.value } })}
                        placeholder="no-reply@domain.com"
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">From Name</label>
                      <input 
                        type="text"
                        value={settings.smtp.fromName}
                        onChange={(e) => setSettings({ ...settings, smtp: { ...settings.smtp, fromName: e.target.value } })}
                        placeholder="CertiGen Admin"
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="secure"
                      checked={settings.smtp.secure}
                      onChange={(e) => setSettings({ ...settings, smtp: { ...settings.smtp, secure: e.target.checked } })}
                      className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                    />
                    <label htmlFor="secure" className="text-xs font-bold text-stone-600 uppercase tracking-widest">Use Secure (SSL/TLS)</label>
                  </div>
                </div>
              )}
            </div>

            {/* Test Email Section */}
            <div className="bg-stone-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Send className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Kirim Email Percobaan</h3>
                    <p className="text-xs text-stone-400">Pastikan konfigurasi di atas sudah benar sebelum testing.</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <input 
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Email tujuan..."
                    className="flex-1 px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-sm focus:ring-2 focus:ring-white focus:border-transparent transition-all placeholder:text-stone-500"
                  />
                  <button 
                    onClick={handleTestEmail}
                    disabled={isTesting}
                    className="px-8 py-3 bg-white text-stone-900 rounded-xl font-bold text-sm hover:bg-stone-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Test Kirim
                  </button>
                </div>
              </div>
              <Mail className="absolute -bottom-6 -right-6 w-32 h-32 text-white opacity-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
