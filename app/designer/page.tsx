"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Palette, ExternalLink, Settings, Award, ChevronRight, Sparkles, ArrowLeft, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import ProfileSettings from "@/components/ProfileSettings";
import DataInputStep from "@/components/DataInputStep";
import EditProcessStep from "@/components/EditProcessStep";
import GenerateStep from "@/components/GenerateStep";
import { Database, Move, Play } from "lucide-react";
import { SupabaseStatus } from "@/components/SupabaseStatus";

type Tab = "design" | "data" | "edit" | "generate" | "settings";

export default function DesignerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-stone-200 rounded-xl" />
          <div className="h-4 w-32 bg-stone-200 rounded" />
        </div>
      </div>
    }>
      <DesignerContent />
    </Suspense>
  );
}

function DesignerContent() {
  const { user, logout, isLoading } = useAuth();
  const { saveTemplate, templates, fetchTemplates } = useRealtimeData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get("tab") as Tab) || "design");
  
  // Shared state for the workflow
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(searchParams.get("templateId"));
  const [savedTemplate, setSavedTemplate] = useState<string | null>(null);
  const [templateElements, setTemplateElements] = useState<any[]>([]);
  const [certificateData, setCertificateData] = useState<any[]>([]);
  const [placeholders, setPlaceholders] = useState<string[]>(["Name", "Institution", "NIP/NUPTK"]);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoading && !user) {
        // Double check session before redirecting to avoid premature logout
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            router.push("/login");
          }
        } else {
          router.push("/login");
        }
      }
    };
    checkAuth();
  }, [user, isLoading, router]);

  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        setSavedTemplate(template.background_url);
        setTemplateElements(template.elements || []);
        // Extract placeholders from elements
        const foundPlaceholders = template.elements
          ?.filter((el: any) => el.type === "text" && el.text?.includes("{"))
          ?.map((el: any) => {
            const match = el.text.match(/{(.*?)}/);
            return match ? match[1] : null;
          })
          ?.filter(Boolean) || [];
        
        if (foundPlaceholders.length > 0) {
          setPlaceholders(prev => Array.from(new Set([...prev, ...foundPlaceholders])));
        }
      }
    }
  }, [selectedTemplateId, templates]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-stone-200 rounded-xl" />
          <div className="h-4 w-32 bg-stone-200 rounded" />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "design", label: "Design", icon: Palette, description: "Create or import template" },
    { id: "data", label: "Data", icon: Database, description: "Manual or CSV import" },
    { id: "edit", label: "Edit", icon: Move, description: "Position placeholders" },
    { id: "generate", label: "Generate", icon: Play, description: "Final export & numbering" },
    { id: "settings", label: "Settings", icon: Settings, description: "API credentials" },
  ];

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    setActiveTab("data");
    const params = new URLSearchParams(searchParams.toString());
    params.set("templateId", id);
    params.set("tab", "data");
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

  const handleTabChange = (tabId: Tab) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <main className="min-h-screen bg-stone-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 bg-stone-100 hover:bg-stone-200 rounded-xl flex items-center justify-center text-stone-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-stone-200">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900 tracking-tight">Certi Gen</h1>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Template Designer</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTabChange(tab.id as Tab)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
                  activeTab === tab.id 
                    ? "bg-white text-stone-900 shadow-sm border border-stone-200" 
                    : "text-stone-500 hover:text-stone-700"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <SupabaseStatus />
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-sm font-bold text-stone-900">{user.username === "admin" ? "Hairi Hasbi" : user.username}</span>
              <span className="text-xs text-stone-500 uppercase tracking-widest font-semibold">{user.role}</span>
            </div>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={logout}
              className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-500 hover:bg-stone-200 hover:text-stone-900 transition-all border border-stone-200"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3 h-3" />
              New Feature
            </div>
            <h2 className="text-4xl font-bold text-stone-900 tracking-tight leading-tight">
              Template Designer
            </h2>
            <p className="text-lg text-stone-500 mt-2 max-w-2xl">
              Choose your preferred way to design certificate templates. Use our professional internal editor or integrate with Canva.
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-400">
            <Link href="/" className="hover:text-stone-600 transition-colors">Dashboard</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-stone-900">Template Designer</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {activeTab === "design" && (
              <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <motion.div 
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm hover:shadow-xl transition-all group flex flex-col items-center text-center"
                  >
                    <div className="w-20 h-20 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-600 mb-6 group-hover:scale-110 transition-transform">
                      <Palette className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-stone-900 mb-2">Internal Designer</h3>
                    <p className="text-stone-500 mb-8 max-w-sm">
                      Our professional built-in editor with full control over text, shapes, and images.
                    </p>
                    <motion.div whileTap={{ scale: 0.98 }} className="w-full">
                      <Link 
                        href="/designer/internal"
                        className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all flex items-center justify-center gap-2"
                      >
                        Open Internal Designer
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </motion.div>
                  </motion.div>

                  <motion.div 
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm hover:shadow-xl transition-all group flex flex-col items-center text-center"
                  >
                    <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                      <ExternalLink className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-stone-900 mb-2">Canva Integration</h3>
                    <p className="text-stone-500 mb-8 max-w-sm">
                      Design your certificate on Canva and import it directly into Certi Gen.
                    </p>
                    <motion.div whileTap={{ scale: 0.98 }} className="w-full">
                      <Link 
                        href="/designer/canva"
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                      >
                        Design on Canva
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </motion.div>
                  </motion.div>
                </div>

                {templates.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                      <Database className="w-5 h-5 text-stone-400" />
                      Your Saved Templates
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {templates.map((template) => (
                        <motion.button
                          key={template.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectTemplate(template.id)}
                          className={cn(
                            "group relative aspect-[4/3] bg-white rounded-2xl border-2 overflow-hidden transition-all text-left",
                            selectedTemplateId === template.id ? "border-stone-900 ring-4 ring-stone-100" : "border-stone-100 hover:border-stone-200"
                          )}
                        >
                          {template.background_url ? (
                            <img src={template.background_url} alt={template.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          ) : (
                            <div className="w-full h-full bg-stone-50 flex items-center justify-center">
                              <Palette className="w-8 h-8 text-stone-200" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4">
                            <div className="flex items-center justify-between">
                              <div className="overflow-hidden">
                                <p className="text-white font-bold text-sm truncate">{template.name}</p>
                                <p className="text-white/70 text-[10px] font-medium">Updated {new Date(template.updated_at).toLocaleDateString()}</p>
                              </div>
                              <motion.div whileTap={{ scale: 0.8 }}>
                                <Link 
                                  href={`/designer/internal?id=${template.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-2 bg-white/20 hover:bg-white/40 rounded-lg text-white transition-colors"
                                  title="Edit Template"
                                >
                                  <Palette className="w-4 h-4" />
                                </Link>
                              </motion.div>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === "data" && (
              <DataInputStep 
                data={certificateData} 
                setData={setCertificateData}
                placeholders={placeholders}
                onNext={() => setActiveTab("edit")}
                onBack={() => setActiveTab("design")}
                selectedTemplateId={selectedTemplateId}
                setSelectedTemplateId={setSelectedTemplateId}
              />
            )}
            {activeTab === "edit" && (
              <EditProcessStep 
                template={savedTemplate}
                elements={templateElements}
                setElements={setTemplateElements}
                data={certificateData}
                onNext={() => setActiveTab("generate")}
                onBack={() => setActiveTab("data")}
              />
            )}
            {activeTab === "generate" && (
              <GenerateStep 
                template={savedTemplate}
                elements={templateElements}
                data={certificateData}
                onBack={() => setActiveTab("edit")}
              />
            )}
            {activeTab === "settings" && <ProfileSettings />}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/80 backdrop-blur-xl border border-stone-200 rounded-2xl p-2 flex items-center justify-between shadow-2xl z-50">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleTabChange(tab.id as Tab)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all",
              activeTab === tab.id 
                ? "bg-stone-900 text-white shadow-lg shadow-stone-200" 
                : "text-stone-400"
            )}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label.split(' ')[0]}</span>
          </motion.button>
        ))}
      </nav>
    </main>
  );
}
