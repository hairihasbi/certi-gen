"use client";

import React, { useState } from "react";
import { Terminal, Copy, Check, Info, Database } from "lucide-react";
import { cn } from "@/lib/utils";

const SQL_CODE = `-- 1. Aktifkan ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Buat Tabel Profiles (Untuk Role & Approval)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Buat Tabel Templates
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  elements JSONB NOT NULL,
  background_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Buat Tabel Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES templates(id),
  user_id UUID REFERENCES auth.users(id),
  recipient_data JSONB NOT NULL,
  certificate_number TEXT UNIQUE NOT NULL,
  image_url TEXT NOT NULL,
  digital_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Trigger Otomatis Buat Profile saat Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role, is_approved)
  VALUES (new.id, new.email, 'user', false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Aktifkan Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE templates;
ALTER PUBLICATION supabase_realtime ADD TABLE certificates;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE settings;

-- 7. Kebijakan RLS (Row Level Security)
-- Aktifkan RLS pada tabel profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Kebijakan: User bisa melihat profil mereka sendiri (Tanpa Rekursi)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Fungsi Helper untuk cek Admin tanpa rekursi RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kebijakan: Admin bisa melihat semua profil (Menggunakan fungsi SECURITY DEFINER)
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin());

-- Kebijakan: Admin bisa mengupdate profil
CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE USING (is_admin());

-- Aktifkan RLS pada tabel lain
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own templates" ON templates
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own certificates" ON certificates
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view certificates for verification" ON certificates
  FOR SELECT USING (true);

-- 8. Buat Tabel Settings
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

export const DatabaseSetupGuide = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-stone-900 rounded-3xl p-8 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
        <Database size={240} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
            <Terminal className="text-white w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold">SQL Setup Guide</h3>
            <p className="text-stone-400 text-xs">Konfigurasi database Supabase Anda dalam satu klik.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-stone-800/50 border border-stone-700 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
              <div className="text-sm text-stone-300 leading-relaxed">
                Salin kode di bawah ini dan tempelkan ke <span className="text-white font-bold">SQL Editor</span> di Dashboard Supabase Anda untuk membuat tabel secara otomatis.
              </div>
            </div>
          </div>

          <div className="relative group">
            <pre className="bg-black/40 rounded-2xl p-6 text-[10px] font-mono text-emerald-400/90 overflow-x-auto border border-stone-800 max-h-[300px] scrollbar-hide">
              {SQL_CODE}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-4 right-4 p-2 rounded-lg bg-stone-800 hover:bg-stone-700 transition-colors border border-stone-700"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-stone-400" />}
            </button>
          </div>

          <div className="flex flex-wrap gap-4">
            <a 
              href="https://supabase.com/dashboard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white text-black rounded-xl text-xs font-bold hover:bg-stone-200 transition-all"
            >
              Buka Supabase Dashboard
            </a>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-700 text-[10px] text-stone-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Status: Menunggu Konfigurasi
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
