"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Award, 
  Calendar, 
  User, 
  ExternalLink,
  ShieldCheck,
  ArrowLeft
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

export default function VerifyCodePage() {
  const params = useParams();
  const code = params.code as string;
  const [status, setStatus] = useState<"loading" | "found" | "not_found">("loading");
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const verify = async () => {
      if (!code) return;
      
      setStatus("loading");
      try {
        if (!supabase) throw new Error("Supabase not connected");

        const { data, error } = await supabase
          .from("certificates")
          .select("*")
          .eq("certificate_number", code)
          .single();

        if (error || !data) {
          setStatus("not_found");
        } else {
          setResult(data);
          setStatus("found");
        }
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("not_found");
      }
    };

    verify();
  }, [code]);

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors mb-8 font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>

        <div className="bg-white p-10 rounded-3xl border border-stone-200 shadow-2xl relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-stone-50 rounded-full -mr-16 -mt-16 -z-0" />
          
          <div className="relative z-10">
            {status === "loading" && (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-stone-900 animate-spin" />
                <p className="text-stone-500 font-bold animate-pulse">Memverifikasi Sertifikat...</p>
              </div>
            )}

            {status === "found" && result && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6 shadow-lg shadow-emerald-100">
                  <CheckCircle className="w-12 h-12" />
                </div>
                
                <h2 className="text-2xl font-bold text-stone-900 mb-2">Sertifikat Terverifikasi</h2>
                <p className="text-stone-500 text-sm mb-8">Dokumen ini adalah asli dan terdaftar dalam sistem Certi Gen.</p>

                <div className="space-y-6 text-left bg-stone-50 p-6 rounded-2xl border border-stone-100 mb-8">
                  <div className="flex items-start gap-4">
                    <User className="w-5 h-5 text-stone-400 mt-1" />
                    <div>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Pemilik Sertifikat</p>
                      <p className="text-lg font-bold text-stone-900">{result.recipient_data?.Name || result.recipient_data?.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Award className="w-5 h-5 text-stone-400 mt-1" />
                    <div>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Kegiatan</p>
                      <p className="text-stone-700 font-medium">{result.recipient_data?.event || "General Event"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Calendar className="w-5 h-5 text-stone-400 mt-1" />
                    <div>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Tanggal Terbit</p>
                      <p className="text-stone-700 font-medium">{new Date(result.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <ShieldCheck className="w-5 h-5 text-stone-400 mt-1" />
                    <div>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Nomor Sertifikat</p>
                      <p className="text-stone-900 font-mono font-bold">{result.certificate_number}</p>
                    </div>
                  </div>
                </div>

                {result.image_url && (
                  <a 
                    href={result.image_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-xl shadow-stone-200"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Lihat Sertifikat Digital
                  </a>
                )}
              </motion.div>
            )}

            {status === "not_found" && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6 shadow-lg shadow-red-100">
                  <XCircle className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 mb-2">Verifikasi Gagal</h2>
                <p className="text-stone-500 mb-8">
                  Kode sertifikat <span className="font-mono font-bold text-stone-900">&quot;{code}&quot;</span> tidak ditemukan atau tidak valid.
                </p>
                <Link 
                  href="/#verify"
                  className="inline-flex items-center justify-center gap-2 w-full py-4 bg-stone-100 text-stone-900 rounded-2xl font-bold hover:bg-stone-200 transition-all"
                >
                  Coba Kode Lain
                </Link>
              </motion.div>
            )}
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white">
              <Award className="w-5 h-5" />
            </div>
            <span className="font-bold text-stone-900">Certi Gen</span>
          </div>
          <p className="text-stone-400 text-xs">
            Sistem Verifikasi Sertifikat Digital Terenkripsi & Real-time
          </p>
        </div>
      </div>
    </main>
  );
}
