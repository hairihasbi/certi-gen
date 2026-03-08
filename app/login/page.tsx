"use client";

import React, { useState, useEffect } from "react";
import { Award, ShieldCheck, User, LogIn, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError("");
    
    try {
      const result = await login(email, password);
      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.message || "Terjadi kesalahan saat masuk.");
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isLoading) {
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
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
      <div className="absolute top-8 left-8">
        <Link href="/" className="flex items-center gap-2 text-stone-500 hover:text-stone-900 font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden"
      >
        <div className="p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4">
              <Award className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Certi Gen</h1>
            <p className="text-stone-500 text-sm mt-1">Silakan masuk untuk melanjutkan</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5 ml-1">
                Email
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Anda"
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 font-medium ml-1">{error}</p>
            )}

            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-stone-200 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {isLoggingIn ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-stone-500">
              Belum punya akun?{" "}
              <Link href="/register" className="text-stone-900 font-bold hover:underline">
                Daftar Sekarang
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-stone-100">
            <p className="text-center text-xs text-stone-400 font-medium">
              Gunakan akun demo:<br/>
              Admin: <span className="text-stone-600">admin / admin123</span><br/>
              User: <span className="text-stone-600">user / user123</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
