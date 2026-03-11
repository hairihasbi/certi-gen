"use client";

import React, { useEffect, useState } from "react";
import { 
  Award, 
  Users, 
  FileText, 
  CheckCircle, 
  Plus, 
  Search, 
  Layout, 
  ArrowRight,
  QrCode,
  ShieldCheck,
  Palette,
  LogOut,
  Mail
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { InfrastructureStatus } from "@/components/InfrastructureStatus";
import { DatabaseSetupGuide } from "@/components/DatabaseSetupGuide";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import { CertificateVerification } from "@/components/CertificateVerification";

export default function DashboardPage() {
  const { user, users, logout, isLoading: authLoading } = useAuth();
  const { templates, certificates, systemStats, isLoading: dataLoading, deleteTemplate } = useRealtimeData();
  const router = useRouter();
  const [isDbReady, setIsDbReady] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");

  // Calculate Storage Usage (Simulated real-time)
  const TEMPLATE_SIZE_MB = 1.5;
  const CERT_SIZE_MB = 0.5;
  const TOTAL_CAPACITY_GB = 100;
  
  const usedMB = (systemStats?.totalTemplates || 0) * TEMPLATE_SIZE_MB + 
                 (systemStats?.totalCertificates || 0) * CERT_SIZE_MB;
  const usedGB = usedMB / 1024;
  const usagePercentage = Math.min((usedGB / TOTAL_CAPACITY_GB) * 100, 100);
  const displayUsedGB = usedGB.toFixed(2);

  const isLoading = authLoading || dataLoading;

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

  const isAdmin = user.role === "admin";
  
  const stats = [
    { label: "Total Sertifikat", value: certificates.length.toLocaleString(), icon: Award, color: "text-blue-600", bg: "bg-blue-50", trend: "+12% dari bulan lalu" },
    { label: "Peserta Terdaftar", value: Array.from(new Set(certificates.map(c => c.recipient_data?.email))).length.toLocaleString(), icon: Users, color: "text-emerald-600", bg: "bg-emerald-50", trend: "+5% dari minggu lalu" },
    { label: "Template Aktif", value: templates.length.toString(), icon: Layout, color: "text-amber-600", bg: "bg-amber-50", trend: "Stabil" },
    { label: "Tingkat Verifikasi", value: "99.9%", icon: ShieldCheck, color: "text-indigo-600", bg: "bg-indigo-50", trend: "Sangat Baik" },
  ];

  const recentCertificates = certificates.slice(0, 6).map(cert => ({
    id: cert.certificate_number || cert.id.substring(0, 8),
    name: cert.recipient_data?.Name || cert.recipient_data?.name || "Unknown",
    event: cert.recipient_data?.event || "General",
    date: new Date(cert.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' }),
    status: "Sent",
    hash: cert.digital_hash?.substring(0, 8) || "N/A"
  }));

  const quickActions = [
    { label: "Buat Template", icon: Plus, href: "/designer", color: "bg-stone-900 text-white" },
    { label: "Kelola User", icon: Users, href: "/dashboard/admin/users", color: "bg-white text-stone-900 border border-stone-200" },
    { label: "Email Config", icon: Mail, href: "/dashboard/admin/email", color: "bg-white text-stone-900 border border-stone-200" },
    { label: "Canva Config", icon: Palette, href: "/dashboard/admin/canva", color: "bg-white text-stone-900 border border-stone-200" },
  ];

  return (
    <main className="min-h-screen bg-[#F8F9FA]">
      {/* Sidebar/Nav */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white shadow-sm">
                <Award className="w-5 h-5" />
              </div>
              <h1 className="text-lg font-bold text-stone-900 tracking-tight">CertiGen <span className="text-stone-400 font-medium">Pro</span></h1>
            </Link>
            
            <nav className="hidden lg:flex items-center gap-1">
              {["Overview", "Templates", "Certificates"].map((item) => (
                <motion.button 
                  key={item} 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(item)}
                  className={cn(
                    "px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors",
                    activeTab === item ? "bg-stone-100 text-stone-900" : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                  )}
                >
                  {item}
                </motion.button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200 focus-within:ring-2 focus-within:ring-stone-900/10 transition-all">
              <Search className="w-3.5 h-3.5 text-stone-400" />
              <input 
                type="text" 
                placeholder="Cari data..." 
                className="bg-transparent border-none focus:ring-0 text-xs text-stone-900 placeholder:text-stone-400 w-40"
              />
            </div>
            
            <div className="flex items-center gap-3 pl-6 border-l border-stone-200">
              <div className="text-right">
                <p className="text-xs font-bold text-stone-900 leading-none">{user.username === "admin" ? "Hairi Hasbi" : user.username}</p>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter mt-0.5">{user.role}</p>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="w-8 h-8 bg-stone-50 rounded-lg flex items-center justify-center text-stone-400 hover:bg-red-50 hover:text-red-600 transition-all border border-stone-200"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Welcome & Quick Actions */}
        <section className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-1">
            <h2 className="text-4xl font-bold text-stone-900 tracking-tight">
              {isAdmin ? "Dashboard Overview" : "Portal Peserta"}
            </h2>
            <p className="text-stone-500 font-medium">
              Kelola ekosistem sertifikasi digital Anda dengan presisi.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action) => (
              <motion.div
                key={action.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link 
                  href={action.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm",
                    action.color
                  )}
                >
                  <action.icon className="w-4 h-4" />
                  {action.label}
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {isAdmin ? (
          <div className="space-y-10">
            {activeTab === "Overview" && (
              <>
                {/* Stats Grid - Bento Style */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, i) => (
                    <motion.div 
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white p-6 rounded-3xl border border-stone-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] group hover:border-stone-300 transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg)}>
                          <stat.icon className={cn("w-5 h-5", stat.color)} />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {stat.trend}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{stat.label}</p>
                      <h3 className="text-3xl font-bold text-stone-900 mt-1 tracking-tight">{stat.value}</h3>
                    </motion.div>
                  ))}
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Recent Certificates - Main Content */}
                  <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                      <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-stone-900 text-lg">Sertifikat Terbaru</h3>
                          <p className="text-xs text-stone-400 font-medium">Data transaksi sertifikat 24 jam terakhir</p>
                        </div>
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveTab("Certificates")}
                          className="px-4 py-2 text-xs font-bold text-stone-600 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors border border-stone-200"
                        >
                          Lihat Semua
                        </motion.button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-stone-50/50 text-stone-400 text-[10px] uppercase tracking-widest font-bold">
                              <th className="px-8 py-4">Recipient</th>
                              <th className="px-8 py-4">Event</th>
                              <th className="px-8 py-4">Hash</th>
                              <th className="px-8 py-4">Date</th>
                              <th className="px-8 py-4 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-50">
                            {recentCertificates.map((cert) => (
                              <tr key={cert.id} className="hover:bg-stone-50/50 transition-colors group">
                                <td className="px-8 py-5">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-stone-900">{cert.name}</span>
                                    <span className="text-[10px] text-stone-400 font-mono">{cert.id}</span>
                                  </div>
                                </td>
                                <td className="px-8 py-5">
                                  <span className="text-xs font-semibold text-stone-600">{cert.event}</span>
                                </td>
                                <td className="px-8 py-5">
                                  <span className="text-[10px] font-mono text-stone-400 bg-stone-100 px-2 py-1 rounded-md">{cert.hash}</span>
                                </td>
                                <td className="px-8 py-5">
                                  <span className="text-xs text-stone-500">{cert.date}</span>
                                </td>
                                <td className="px-8 py-5 text-right flex items-center justify-end gap-3">
                                  <motion.button 
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.8 }}
                                    onClick={async () => {
                                      const email = certificates.find(c => (c.certificate_number || c.id.substring(0, 8)) === cert.id)?.recipient_data?.email;
                                      if (!email) {
                                        alert("Email tidak ditemukan untuk peserta ini.");
                                        return;
                                      }
                                      const fullCert = certificates.find(c => (c.certificate_number || c.id.substring(0, 8)) === cert.id);
                                      if (!fullCert) return;

                                      try {
                                        const res = await fetch("/api/admin/email/send-certificate", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ certificateId: fullCert.id, recipientEmail: email }),
                                        });
                                        const data = await res.json();
                                        if (data.success) alert("Email berhasil dikirim!");
                                        else alert("Gagal kirim email: " + data.error);
                                      } catch (err) {
                                        alert("Terjadi kesalahan saat kirim email.");
                                      }
                                    }}
                                    className="p-2 text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                    title="Kirim Email"
                                  >
                                    <Mail className="w-4 h-4" />
                                  </motion.button>
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    <div className="w-1 h-1 rounded-full bg-emerald-600" />
                                    {cert.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="px-8 py-4 bg-stone-50/50 border-t border-stone-100 text-center">
                        <motion.button 
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveTab("Certificates")}
                          className="text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors"
                        >
                          Lihat Semua Sertifikat &rarr;
                        </motion.button>
                      </div>
                    </div>

                    {/* System Activity Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                          <h3 className="text-xl font-bold mb-2">Laporan Audit</h3>
                          <p className="text-indigo-100 text-xs mb-6 leading-relaxed opacity-80">
                            Tinjau setiap aktivitas sistem, mulai dari login hingga pembuatan sertifikat massal untuk keamanan data.
                          </p>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link 
                              href="/dashboard/admin/logs"
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-50 transition-all shadow-lg shadow-indigo-900/20"
                            >
                              Buka Log Sistem
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </motion.div>
                        </div>
                        <FileText className="absolute -bottom-6 -right-6 w-32 h-32 text-white opacity-10 group-hover:scale-110 transition-transform duration-500" />
                      </div>

                      <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                              <Palette className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-stone-900">Designer Pro</h3>
                          </div>
                          <p className="text-stone-500 text-xs leading-relaxed">
                            Gunakan editor internal kami yang powerful untuk membuat template sertifikat dengan variabel dinamis.
                          </p>
                        </div>
                        <motion.div whileHover={{ x: 5 }} whileTap={{ scale: 0.95 }}>
                          <Link 
                            href="/designer"
                            className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-stone-900 hover:gap-3 transition-all"
                          >
                            Mulai Mendesain
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar - Contextual Info */}
                  <div className="lg:col-span-4 space-y-8">
                    {/* System Health */}
                    <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
                      <h3 className="font-bold text-stone-900 mb-6 flex items-center justify-between">
                        Status Infrastruktur
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Live</span>
                      </h3>
                      <InfrastructureStatus onStatusChange={setIsDbReady} />
                      <div className="mt-8 pt-6 border-t border-stone-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-stone-400 uppercase">Storage Usage</span>
                          <span className="text-[10px] font-bold text-stone-900">{displayUsedGB} GB / {TOTAL_CAPACITY_GB} GB</span>
                        </div>
                        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-stone-900 rounded-full transition-all duration-1000" 
                            style={{ width: `${usagePercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {user.role === "admin" && !isDbReady && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-3"
                      >
                        <DatabaseSetupGuide />
                      </motion.div>
                    )}

                    {/* User Management Quick View */}
                    <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-stone-900">Pengguna Baru</h3>
                        <Link href="/dashboard/admin/users" className="text-[10px] font-bold text-indigo-600 hover:underline uppercase">Lihat Semua</Link>
                      </div>
                      <div className="space-y-4">
                        {users.filter(u => !u.isApproved).slice(0, 3).map(u => (
                          <div key={u.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-100">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-stone-400 border border-stone-200">
                                <Users className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-stone-900">{u.username}</span>
                                <span className="text-[9px] text-stone-400 uppercase font-bold tracking-tighter">Pending Approval</span>
                              </div>
                            </div>
                            <Link href="/dashboard/admin/users" className="p-1.5 bg-white text-stone-900 rounded-lg border border-stone-200 hover:bg-stone-100 transition-all">
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        ))}
                        {users.filter(u => !u.isApproved).length === 0 && (
                          <div className="text-center py-4">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Tidak ada antrian approval</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "Templates" && (
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-stone-900">Manajemen Template</h3>
                    <p className="text-stone-500">Kelola semua template sertifikat yang tersedia.</p>
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link 
                      href="/designer"
                      className="px-6 py-2.5 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Buat Template Baru
                    </Link>
                  </motion.div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template) => (
                    <div key={template.id} className="group bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden hover:shadow-md transition-all">
                      <div className="aspect-[4/3] bg-stone-200 relative overflow-hidden">
                        {template.background_url ? (
                          <img src={template.background_url} alt={template.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400">
                            <Palette className="w-12 h-12" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Link 
                              href={`/designer?tab=edit&templateId=${template.id}`}
                              className="px-4 py-2 bg-white text-stone-900 rounded-lg font-bold text-xs"
                            >
                              Edit
                            </Link>
                          </motion.div>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={async () => {
                              if (confirm(`Apakah Anda yakin ingin menghapus template "${template.name}"?`)) {
                                const { error } = await deleteTemplate(template.id);
                                if (error) alert("Gagal menghapus template: " + error.message);
                              }
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-xs"
                          >
                            Hapus
                          </motion.button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-stone-900 truncate">{template.name}</h4>
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">
                          Dibuat {new Date(template.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {templates.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                      <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-300 mx-auto mb-4">
                        <Layout className="w-8 h-8" />
                      </div>
                      <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Belum ada template</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "Certificates" && (
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-stone-900 text-lg">Semua Sertifikat</h3>
                    <p className="text-xs text-stone-400 font-medium">Daftar lengkap sertifikat yang telah diterbitkan</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                      <input 
                        type="text" 
                        placeholder="Cari nama atau kode..." 
                        className="pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-stone-900/10 outline-none w-64"
                      />
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (certificates.length === 0) return;
                        const headers = ["Recipient", "Email", "Event", "Certificate Number", "Hash", "Date"];
                        const rows = certificates.map(cert => [
                          cert.recipient_data?.Name || cert.recipient_data?.name || "Unknown",
                          cert.recipient_data?.email || "",
                          cert.recipient_data?.event || "General",
                          cert.certificate_number || "",
                          cert.digital_hash || "",
                          new Date(cert.created_at).toLocaleDateString()
                        ]);
                        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement("a");
                        const url = URL.createObjectURL(blob);
                        link.setAttribute("href", url);
                        link.setAttribute("download", `certificates_${new Date().toISOString().split('T')[0]}.csv`);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="px-4 py-2 text-xs font-bold text-stone-600 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors border border-stone-200"
                    >
                      Ekspor CSV
                    </motion.button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-stone-50/50 text-stone-400 text-[10px] uppercase tracking-widest font-bold">
                        <th className="px-8 py-4">Recipient</th>
                        <th className="px-8 py-4">Event</th>
                        <th className="px-8 py-4">Certificate Number</th>
                        <th className="px-8 py-4">Hash</th>
                        <th className="px-8 py-4">Date</th>
                        <th className="px-8 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {certificates.map((cert) => (
                        <tr key={cert.id} className="hover:bg-stone-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-stone-900">{cert.recipient_data?.Name || cert.recipient_data?.name || "Unknown"}</span>
                              <span className="text-[10px] text-stone-400 font-medium">{cert.recipient_data?.email}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-xs font-semibold text-stone-600">{cert.recipient_data?.event || "General"}</span>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-xs font-mono text-stone-900">{cert.certificate_number}</span>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-[10px] font-mono text-stone-400 bg-stone-100 px-2 py-1 rounded-md">{cert.digital_hash?.substring(0, 12)}...</span>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-xs text-stone-500">{new Date(cert.created_at).toLocaleDateString()}</span>
                          </td>
                          <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                            <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all">
                              <FileText className="w-4 h-4" />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }} className="p-2 text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                              <Mail className="w-4 h-4" />
                            </motion.button>
                          </td>
                        </tr>
                      ))}
                      {certificates.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-8 py-20 text-center">
                            <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Belum ada data sertifikat</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* User View: Verification Focus */}
            <div className="bg-white p-10 rounded-3xl border border-stone-200 shadow-xl">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-8">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-stone-900 mb-4">Verifikasi Sertifikat</h3>
              <p className="text-stone-500 mb-8">
                Pastikan sertifikat yang Anda terima adalah asli. Masukkan kode unik yang tertera pada sertifikat Anda.
              </p>
              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Contoh: CERT-XXXX-XXXX" 
                    className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-lg font-mono focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                  />
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold text-lg hover:bg-stone-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-stone-200"
                >
                  <CheckCircle className="w-6 h-6" />
                  Verifikasi Sekarang
                </motion.button>
                <div className="flex items-center gap-4 py-4">
                  <div className="flex-1 h-px bg-stone-100" />
                  <span className="text-xs font-bold text-stone-300 uppercase tracking-widest">Atau</span>
                  <div className="flex-1 h-px bg-stone-100" />
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-stone-100 text-stone-900 rounded-2xl font-bold text-lg hover:bg-stone-200 transition-all flex items-center justify-center gap-3"
                >
                  <QrCode className="w-6 h-6" />
                  Scan QR Code
                </motion.button>
              </div>
            </div>

            <div className="space-y-8">
              {/* Designer Card for User */}
              <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-4">
                    <Palette className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 mb-2">Designer Template</h3>
                  <p className="text-sm text-stone-500 mb-6">
                    Mulai membuat desain sertifikat kustom Anda sendiri menggunakan editor internal atau Canva.
                  </p>
                  <motion.div whileHover={{ x: 5 }} whileTap={{ scale: 0.95 }}>
                    <Link 
                      href="/designer"
                      className="inline-flex items-center gap-2 text-sm font-bold text-stone-900 hover:gap-3 transition-all"
                    >
                      Buka Designer
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                </div>
                <Palette className="absolute -bottom-4 -right-4 w-24 h-24 text-stone-50 opacity-5 group-hover:scale-110 transition-transform" />
              </div>

              <div className="bg-stone-900 p-10 rounded-3xl text-white relative overflow-hidden">
                <h3 className="text-2xl font-bold mb-4 relative z-10">Unduh Sertifikat</h3>
                <p className="text-stone-400 mb-8 relative z-10">
                  Sudah menyelesaikan kegiatan? Masukkan email Anda untuk mengunduh sertifikat digital Anda.
                </p>
                <div className="relative z-10 space-y-4">
                  <input 
                    type="email" 
                    placeholder="email@anda.com" 
                    className="w-full px-6 py-4 bg-stone-800 border border-stone-700 rounded-2xl text-white focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                  />
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-white text-stone-900 rounded-2xl font-bold text-lg hover:bg-stone-100 transition-all flex items-center justify-center gap-3"
                  >
                    <FileText className="w-6 h-6" />
                    Cari Sertifikat
                  </motion.button>
                </div>
                <Award className="absolute -bottom-10 -right-10 w-64 h-64 text-stone-800 opacity-30" />
              </div>

              <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
                <h4 className="font-bold text-stone-900 mb-4">Butuh Bantuan?</h4>
                <p className="text-sm text-stone-500 mb-6">
                  Jika Anda mengalami kendala dalam verifikasi atau pengunduhan sertifikat, silakan hubungi tim dukungan kami.
                </p>
                <motion.button 
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm font-bold text-stone-900 hover:underline"
                >
                  Hubungi Support &rarr;
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
