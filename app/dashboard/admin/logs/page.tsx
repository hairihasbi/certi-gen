"use client";

import React, { useState } from "react";
import { 
  Activity, 
  Search, 
  ArrowLeft,
  Calendar,
  Clock,
  User as UserIcon,
  Filter,
  Trash2
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SystemLogsPage() {
  const { user, logs } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");

  // Protect route
  if (!user || user.role !== "admin") {
    if (typeof window !== "undefined") {
      router.push("/dashboard");
    }
    return null;
  }

  const actions = Array.from(new Set(logs.map(l => l.action)));

  const filteredLogs = logs
    .filter(l => {
      const matchesSearch = l.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           l.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterAction === "all" || l.action === filterAction;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      time: date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    };
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-1">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-900 text-[10px] font-bold uppercase tracking-widest mb-4 transition-colors">
              <ArrowLeft className="w-3 h-3" />
              Back to Overview
            </Link>
            <h1 className="text-4xl font-bold text-stone-900 tracking-tight flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Activity className="w-6 h-6" />
              </div>
              System Audit Logs
            </h1>
            <p className="text-stone-500 font-medium">Monitor all critical system activities and user actions.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
              <input 
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-4 py-3 bg-white border border-stone-200 rounded-2xl text-sm w-full sm:w-64 focus:ring-4 focus:ring-stone-900/5 focus:border-stone-900 transition-all shadow-sm"
              />
            </div>
            <div className="relative group">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
              <select 
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="pl-11 pr-10 py-3 bg-white border border-stone-200 rounded-2xl text-sm w-full appearance-none focus:ring-4 focus:ring-stone-900/5 focus:border-stone-900 transition-all shadow-sm font-bold text-stone-600"
              >
                <option value="all">All Actions</option>
                {actions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className="bg-white rounded-[32px] border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-100">
                  <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Timestamp</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Operator</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Action</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Activity Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                <AnimatePresence mode="popLayout">
                  {filteredLogs.map((log) => {
                    const { date, time } = formatDateTime(log.timestamp);
                    return (
                      <motion.tr 
                        key={log.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-stone-50/50 transition-colors group"
                      >
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-stone-900">{time}</span>
                            <span className="text-[10px] text-stone-400 uppercase font-bold tracking-tighter">{date}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 border border-stone-200 group-hover:scale-105 transition-transform">
                              <UserIcon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-stone-700">{log.username}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-600 text-[10px] font-bold uppercase tracking-wider border border-stone-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs text-stone-500 leading-relaxed max-w-xl">{log.details}</p>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center text-stone-400">
                        <div className="w-16 h-16 bg-stone-50 rounded-3xl flex items-center justify-center mb-4 border border-stone-100">
                          <Activity className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-sm font-bold text-stone-900">No logs found</p>
                        <p className="text-xs text-stone-400 mt-1">Try adjusting your filters or search.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-8 py-6 bg-stone-50/50 border-t border-stone-100 flex items-center justify-between">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              Showing {filteredLogs.length} of {logs.length} audit entries
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-[10px] font-bold text-stone-400 cursor-not-allowed">Prev</button>
              <button className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-[10px] font-bold text-stone-900">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
