"use client";

import React from "react";
import { 
  Award, 
  CheckCircle, 
  ArrowRight,
  QrCode,
  ShieldCheck,
  FileText,
  Lock,
  Zap,
  Globe,
  Palette
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { SupabaseStatus } from "@/components/SupabaseStatus";
import { CertificateVerification } from "@/components/CertificateVerification";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Award className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">Certi Gen</h1>
          </div>

          <div className="flex items-center gap-4">
            <SupabaseStatus />
            {user ? (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href="/dashboard"
                  className="px-6 py-2.5 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-all shadow-lg shadow-stone-200 block"
                >
                  Ke Dashboard
                </Link>
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href="/login"
                  className="px-6 py-2.5 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-all shadow-lg shadow-stone-200 block"
                >
                  Login
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-200 text-stone-600 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6">
                <Zap className="w-3 h-3" />
                Sistem Sertifikat Digital Terpercaya
              </div>
              <h2 className="text-6xl font-bold text-stone-900 tracking-tight leading-[1.1] mb-6">
                Terbitkan & Verifikasi Sertifikat <span className="text-stone-400 italic">Tanpa Ragu.</span>
              </h2>
              <p className="text-xl text-stone-500 mb-10 leading-relaxed">
                Certi Gen membantu organisasi menerbitkan sertifikat digital yang aman, dapat diverifikasi secara instan, dan memiliki desain profesional.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <Link 
                    href="/login"
                    className="w-full sm:w-auto px-8 py-4 bg-stone-900 text-white rounded-2xl font-bold text-lg hover:bg-stone-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-stone-200"
                  >
                    Mulai Sekarang
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <a 
                    href="#verify"
                    className="w-full sm:w-auto px-8 py-4 bg-white text-stone-900 border border-stone-200 rounded-2xl font-bold text-lg hover:bg-stone-50 transition-all flex items-center justify-center gap-3"
                  >
                    Verifikasi Sertifikat
                  </a>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-stone-100 to-transparent -z-10" />
        <Award className="absolute -bottom-20 -right-20 w-96 h-96 text-stone-200 opacity-20 -z-10 rotate-12" />
      </section>

      {/* Public Verification Section */}
      <section id="verify" className="py-24 bg-white border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-8">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h3 className="text-4xl font-bold text-stone-900 tracking-tight mb-6">Verifikasi Keaslian Sertifikat</h3>
              <p className="text-lg text-stone-500 mb-8 leading-relaxed">
                Setiap sertifikat yang diterbitkan melalui Certi Gen dilengkapi dengan kode unik dan QR Code terenkripsi untuk memastikan validitas dokumen.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mt-1">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900">Verifikasi Instan</h4>
                    <p className="text-sm text-stone-500">Hasil verifikasi muncul dalam hitungan detik.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mt-1">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900">Aman & Terenkripsi</h4>
                    <p className="text-sm text-stone-500">Data sertifikat disimpan dengan standar keamanan tinggi.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full">
              <CertificateVerification />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
          <h3 className="text-3xl font-bold text-stone-900 tracking-tight mb-4">Mengapa Memilih Certi Gen?</h3>
          <p className="text-stone-500 max-w-2xl mx-auto">Solusi lengkap untuk kebutuhan sertifikasi digital Anda, dari desain hingga distribusi.</p>
        </div>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Palette, title: "Custom Designer", desc: "Editor internal yang powerful atau integrasi langsung dengan Canva." },
            { icon: Globe, title: "Akses Global", desc: "Sertifikat dapat diakses dan diverifikasi dari mana saja di seluruh dunia." },
            { icon: Lock, title: "Anti-Pemalsuan", desc: "Teknologi QR Code unik mencegah penggandaan sertifikat secara ilegal." }
          ].map((feature, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-stone-900 rounded-xl flex items-center justify-center text-white mb-6">
                <feature.icon className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-stone-900 mb-3">{feature.title}</h4>
              <p className="text-stone-500 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-stone-900">
                <Award className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Certi Gen</h1>
            </div>
            <p className="text-stone-400 max-w-sm leading-relaxed">
              Membangun kepercayaan melalui sertifikasi digital yang aman dan dapat diverifikasi.
            </p>
          </div>
          <div>
            <h5 className="font-bold mb-6">Tautan Cepat</h5>
            <ul className="space-y-4 text-stone-400 text-sm">
              <li><Link href="/login" className="hover:text-white transition-colors">Login Admin</Link></li>
              <li><a href="#verify" className="hover:text-white transition-colors">Verifikasi</a></li>
              <li><Link href="/designer" className="hover:text-white transition-colors">Designer</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-6">Dukungan</h5>
            <ul className="space-y-4 text-stone-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Pusat Bantuan</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Kontak Kami</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-stone-800 text-center text-stone-500 text-xs">
          &copy; 2024 Certi Gen. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
