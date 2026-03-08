"use client";

import React from "react";
import { 
  Palette, 
  ArrowLeft,
  Copy,
  CheckCircle2,
  ExternalLink,
  Info
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function CanvaConfigPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = React.useState<string | null>(null);

  // Protect route
  if (!user || user.role !== "admin") {
    if (typeof window !== "undefined") {
      router.push("/dashboard");
    }
    return null;
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const configs = [
    {
      label: "Webhook URL",
      value: `${baseUrl}/api/webhooks/canva`,
      key: "webhook",
      description: "Used by Canva to notify our system about design events."
    },
    {
      label: "Redirect URL",
      value: `${baseUrl}/api/auth/canva/callback`,
      key: "redirect",
      description: "The OAuth callback URL for Canva authentication."
    },
    {
      label: "Return URL",
      value: `${baseUrl}/canva-return`,
      key: "return",
      description: "Where users are sent after completing a design in Canva."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-900 text-[10px] font-bold uppercase tracking-widest mb-4 transition-colors">
            <ArrowLeft className="w-3 h-3" />
            Back to Overview
          </Link>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-stone-900 rounded-[24px] flex items-center justify-center text-amber-400 shadow-xl shadow-stone-200">
              <Palette className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-stone-900 tracking-tight">Canva Integration</h1>
              <p className="text-stone-500 font-medium mt-1">Developer configuration for Canva App integration.</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-8">
          {/* Instructions Card */}
          <div className="bg-amber-50 border border-amber-100 rounded-[32px] p-8 flex gap-6 items-start">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm shrink-0">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-900 mb-2">Setup Instructions</h3>
              <p className="text-amber-800/70 text-sm leading-relaxed">
                Copy the URLs below and paste them into your Canva Developer Portal under the <strong>&quot;App Settings&quot;</strong> section. 
                These URLs are essential for the &quot;Design with Canva&quot; button to function correctly for all users.
              </p>
              <a 
                href="https://www.canva.com/developers/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-xs font-bold text-amber-900 hover:underline"
              >
                Open Canva Developer Portal
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Config Cards */}
          <div className="space-y-6">
            {configs.map((config) => (
              <div key={config.key} className="bg-white border border-stone-200 rounded-[32px] p-8 shadow-sm group hover:border-stone-300 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-stone-900 uppercase tracking-widest">{config.label}</h4>
                    <p className="text-xs text-stone-400 font-medium">{config.description}</p>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(config.value, config.key)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs transition-all shrink-0",
                      copied === config.key 
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                        : "bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-200"
                    )}
                  >
                    {copied === config.key ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy URL
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-6 p-4 bg-stone-50 rounded-2xl border border-stone-100 font-mono text-xs text-stone-600 break-all leading-relaxed">
                  {config.value}
                </div>
              </div>
            ))}
          </div>

          {/* Security Note */}
          <div className="text-center py-8">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-relaxed">
              These settings are only visible to administrators.<br />
              Do not share these URLs with unauthorized personnel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
