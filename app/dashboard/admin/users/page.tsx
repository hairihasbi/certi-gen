"use client";

import React, { useState } from "react";
import { 
  Users, 
  Trash2, 
  UserX, 
  UserCheck, 
  Search, 
  ArrowLeft,
  Shield,
  User as UserIcon,
  MoreVertical,
  Calendar
} from "lucide-react";
import { useAuth, User } from "@/lib/auth";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function UserManagementPage() {
  const { user, users, deleteUser, toggleUserStatus, approveUser } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  // Protect route
  if (!user || user.role !== "admin") {
    if (typeof window !== "undefined") {
      router.push("/dashboard");
    }
    return null;
  }

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
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
              <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Users className="w-6 h-6" />
              </div>
              User Management
            </h1>
            <p className="text-stone-500 font-medium">Manage access, roles, and registration approvals.</p>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
            <input 
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-3 bg-white border border-stone-200 rounded-2xl text-sm w-full md:w-80 focus:ring-4 focus:ring-stone-900/5 focus:border-stone-900 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* User Stats - Bento Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-8 rounded-[32px] border border-stone-200 shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Total Users</p>
              <p className="text-4xl font-bold text-stone-900 tracking-tight">{users.length}</p>
            </div>
            <Users className="absolute -bottom-4 -right-4 w-24 h-24 text-stone-50 opacity-50 group-hover:scale-110 transition-transform" />
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-stone-200 shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Active Accounts</p>
              <p className="text-4xl font-bold text-emerald-600 tracking-tight">{users.filter(u => u.isActive).length}</p>
            </div>
            <UserCheck className="absolute -bottom-4 -right-4 w-24 h-24 text-emerald-50 opacity-50 group-hover:scale-110 transition-transform" />
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-stone-200 shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Pending Approval</p>
              <p className="text-4xl font-bold text-amber-600 tracking-tight">{users.filter(u => !u.isApproved).length}</p>
            </div>
            <Shield className="absolute -bottom-4 -right-4 w-24 h-24 text-amber-50 opacity-50 group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-[32px] border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-100">
                  <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">User Profile</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Role</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Joined</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                <AnimatePresence mode="popLayout">
                  {filteredUsers.map((u) => (
                    <motion.tr 
                      key={u.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="hover:bg-stone-50/50 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm",
                            u.role === "admin" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 border border-stone-200"
                          )}>
                            {u.role === "admin" ? <Shield className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900 text-sm">{u.username}</p>
                            <p className="text-[10px] text-stone-400 font-mono">ID: {u.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                          u.role === "admin" ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-600 border-stone-200"
                        )}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1.5">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                            u.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                          )}>
                            <div className={cn("w-1 h-1 rounded-full", u.isActive ? "bg-emerald-600" : "bg-red-600")} />
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
                          {!u.isApproved && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                              <div className="w-1 h-1 rounded-full bg-amber-600 animate-pulse" />
                              Pending Approval
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-stone-500 text-xs font-medium">
                          <Calendar className="w-3.5 h-3.5 opacity-50" />
                          {formatDate(u.createdAt)}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!u.isApproved && (
                            <button 
                              onClick={() => approveUser(u.id)}
                              title="Approve User"
                              className="p-2.5 rounded-xl text-amber-600 bg-amber-50 hover:bg-amber-100 transition-all border border-amber-100"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => toggleUserStatus(u.id)}
                            disabled={u.id === user.id}
                            title={u.isActive ? "Deactivate" : "Activate"}
                            className={cn(
                              "p-2.5 rounded-xl transition-all border",
                              u.id === user.id ? "opacity-20 cursor-not-allowed bg-stone-50 border-stone-100" : 
                              u.isActive ? "text-stone-400 bg-white border-stone-200 hover:text-red-600 hover:bg-red-50 hover:border-red-100" : 
                              "text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100"
                            )}
                          >
                            {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm(`Hapus pengguna ${u.username}?`)) {
                                deleteUser(u.id);
                              }
                            }}
                            disabled={u.id === user.id}
                            title="Delete"
                            className={cn(
                              "p-2.5 rounded-xl transition-all border",
                              u.id === user.id ? "opacity-20 cursor-not-allowed bg-stone-50 border-stone-100" : 
                              "text-stone-400 bg-white border-stone-200 hover:text-red-600 hover:bg-red-50 hover:border-red-100"
                            )}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center text-stone-400">
                        <div className="w-16 h-16 bg-stone-50 rounded-3xl flex items-center justify-center mb-4 border border-stone-100">
                          <Users className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-sm font-bold text-stone-900">No users found</p>
                        <p className="text-xs text-stone-400 mt-1">Try adjusting your search terms.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-8 py-6 bg-stone-50/50 border-t border-stone-100 flex items-center justify-between">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              Showing {filteredUsers.length} of {users.length} users
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
