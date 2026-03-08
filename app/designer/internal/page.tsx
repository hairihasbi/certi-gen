"use client";

import React, { useState, useEffect } from "react";
import { Award, ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import InternalDesigner from "@/components/InternalDesigner";
import { SupabaseStatus } from "@/components/SupabaseStatus";

export default function InternalDesignerPage() {
  const { user, logout, isLoading } = useAuth();
  const { saveTemplate } = useRealtimeData();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

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

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/designer" className="w-8 h-8 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center justify-center text-stone-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white shadow-lg shadow-stone-200">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-stone-900 tracking-tight">Internal Designer</h1>
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Certi Gen</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <SupabaseStatus />
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-xs font-bold text-stone-900">{user.username}</span>
              <span className="text-[10px] text-stone-500 uppercase tracking-widest font-semibold">{user.role}</span>
            </div>
            <button 
              onClick={logout}
              className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center text-stone-500 hover:bg-stone-200 hover:text-stone-900 transition-all border border-stone-200"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <InternalDesigner 
          onSave={async (template, elements) => {
            // Save to Supabase
            await saveTemplate("My Template", elements, template);
            router.push("/designer?tab=data");
          }} 
        />
      </div>
    </main>
  );
}
