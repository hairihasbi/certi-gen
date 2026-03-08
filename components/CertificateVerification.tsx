"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  QrCode, 
  Search, 
  Award, 
  Calendar, 
  User, 
  ExternalLink,
  ShieldCheck,
  Hash
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

import { verifyCertificateHash, formatCertificateDataForHashing } from "@/lib/security";

export const CertificateVerification = () => {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "found" | "not_found">("idle");
  const [result, setResult] = useState<any>(null);
  const [isHashValid, setIsHashValid] = useState<boolean | null>(null);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) return;

    setStatus("loading");
    setResult(null);
    setIsHashValid(null);

    try {
      if (!supabase) throw new Error("Supabase not connected");

      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .eq("certificate_number", code.trim())
        .single();

      if (error || !data) {
        setStatus("not_found");
      } else {
        setResult(data);
        setStatus("found");
        
        // Verify Hash
        if (data.digital_hash) {
          const hashInput = formatCertificateDataForHashing(data.recipient_data, data.certificate_number);
          const isValid = await verifyCertificateHash(hashInput, data.digital_hash);
          setIsHashValid(isValid);
        }
      }
    } catch (err) {
      console.error("Verification error:", err);
      setStatus("not_found");
    }
  };

  return (
    <div className="w-full">
      <div className="bg-stone-50 p-6 sm:p-10 rounded-3xl border border-stone-200 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h4 className="text-xl font-bold text-stone-900">Cek Sertifikat Anda</h4>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
              <Search className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Masukkan Kode Sertifikat (Contoh: CERT-001)" 
              className="w-full pl-12 pr-6 py-4 bg-white border border-stone-200 rounded-2xl text-lg font-mono focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all outline-none"
            />
          </div>
          
          <button 
            type="submit"
            disabled={status === "loading" || !code.trim()}
            className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold text-lg hover:bg-stone-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "loading" ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <CheckCircle className="w-6 h-6" />
            )}
            Verifikasi Sekarang
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Atau</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <button 
            type="button"
            className="w-full py-4 bg-white text-stone-900 border border-stone-200 rounded-2xl font-bold text-lg hover:bg-stone-50 transition-all flex items-center justify-center gap-3"
          >
            <QrCode className="w-6 h-6" />
            Scan QR Code
          </button>
        </form>

        <AnimatePresence mode="wait">
          {status === "found" && result && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-8 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl"
            >
              <div className="flex items-center gap-3 text-emerald-700 font-bold mb-4">
                <CheckCircle className="w-6 h-6" />
                Sertifikat Terverifikasi Asli
              </div>

              {isHashValid !== null && (
                <div className={cn(
                  "mb-6 p-3 rounded-xl flex items-center gap-3 text-xs font-bold",
                  isHashValid ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                )}>
                  <Hash className="w-4 h-4" />
                  {isHashValid ? (
                    <span>Digital Signature Valid: {result.digital_hash?.substring(0, 16)}...</span>
                  ) : (
                    <span>Digital Signature INVALID - Dokumen mungkin telah dimodifikasi!</span>
                  )}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-stone-400 border border-emerald-100">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Nama Peserta</p>
                    <p className="text-lg font-bold text-stone-900">{result.recipient_data?.Name || result.recipient_data?.name || "Unknown"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-stone-400 border border-emerald-100">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Kegiatan / Event</p>
                    <p className="text-stone-700 font-medium">{result.recipient_data?.event || "General Event"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-stone-400 border border-emerald-100">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Tanggal Terbit</p>
                    <p className="text-stone-700 font-medium">{new Date(result.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                {result.image_url && (
                  <a 
                    href={result.image_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-white text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Lihat Dokumen Digital
                  </a>
                )}
              </div>
            </motion.div>
          )}

          {status === "not_found" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-8 p-6 bg-red-50 border border-red-100 rounded-2xl text-center"
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-red-500 mx-auto mb-4 border border-red-100">
                <XCircle className="w-8 h-8" />
              </div>
              <h5 className="text-red-800 font-bold mb-1">Sertifikat Tidak Ditemukan</h5>
              <p className="text-red-600 text-sm">
                Pastikan kode yang Anda masukkan sudah benar atau hubungi pihak penyelenggara.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
