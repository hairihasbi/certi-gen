"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

export type Role = "admin" | "user";

export interface User {
  id: string;
  username: string;
  role: Role;
  isActive: boolean;
  isApproved: boolean;
  createdAt: string;
}

export interface SystemLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  timestamp: string;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  logs: SystemLog[];
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<void>;
  approveUser: (id: string) => Promise<void>;
  addLog: (action: string, details: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabase) return null;
    console.log("Fetching profile for userId:", userId);
    
    try {
      const fetchPromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 5000)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      
      if (error) {
        console.error("Error fetching profile:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return null;
      }
      
      if (!data) {
        console.warn("No profile data found for userId:", userId);
        return null;
      }
      
      console.log("Profile data fetched successfully:", data);
      
      return {
        id: data.id,
        username: data.username,
        role: data.role as Role,
        isActive: data.is_active,
        isApproved: data.is_approved,
        createdAt: data.created_at,
      };
    } catch (err) {
      console.error("Profile fetch failed or timed out:", err);
      return null;
    }
  }, []);

  const fetchAllUsers = useCallback(async () => {
    if (!supabase || user?.role !== "admin") return;
    const { data, error } = await supabase.from("profiles").select("*");
    if (!error && data) {
      setUsers(data.map(d => ({
        id: d.id,
        username: d.username,
        role: d.role as Role,
        isActive: d.is_active,
        isApproved: d.is_approved,
        createdAt: d.created_at,
      })));
    }
  }, [user?.role]);

  useEffect(() => {
    if (!supabase) {
      const timer = setTimeout(() => setIsLoading(false), 0);
      return () => clearTimeout(timer);
    }

    // Safety timeout: if auth state doesn't resolve in 10 seconds, stop loading
    const safetyTimeout = setTimeout(() => {
      console.warn("Auth state resolution timed out. Forcing isLoading to false.");
      setIsLoading(false);
    }, 10000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      try {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (profile) {
            setUser(profile);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Critical error in onAuthStateChange handler:", err);
        setUser(null);
      } finally {
        setIsLoading(false);
        clearTimeout(safetyTimeout);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [fetchProfile]);

  useEffect(() => {
    if (user?.role === "admin") {
      const timer = setTimeout(() => {
        fetchAllUsers();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user?.role, fetchAllUsers]);

  const addLog = (action: string, details: string) => {
    // For now, keep logs in localStorage or you could create a 'logs' table in Supabase
    const newLog: SystemLog = {
      id: Math.random().toString(36).substring(2, 9),
      userId: user?.id || "system",
      username: user?.username || "System",
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    const updatedLogs = [newLog, ...logs].slice(0, 1000);
    setLogs(updatedLogs);
    localStorage.setItem("certigen_logs", JSON.stringify(updatedLogs));
  };

  const login = async (email: string, password: string) => {
    if (!supabase) return { success: false, message: "Supabase not configured." };
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { success: false, message: error.message };

    const profile = await fetchProfile(data.user.id);
    if (!profile) {
      return { 
        success: false, 
        message: "Profil tidak ditemukan. Pastikan: 1. Tabel 'profiles' memiliki record dengan ID yang sesuai dengan Auth UID. 2. Kebijakan RLS (Row Level Security) sudah dikonfigurasi. 3. Anda telah menjalankan SQL Setup di Dashboard." 
      };
    }
    
    if (!profile.isApproved && profile.role !== "admin") {
      await supabase.auth.signOut();
      return { success: false, message: "Akun Anda sedang menunggu persetujuan admin." };
    }

    if (!profile.isActive) {
      await supabase.auth.signOut();
      return { success: false, message: "Akun Anda telah dinonaktifkan." };
    }

    setUser(profile);
    addLog("Login", `User ${email} logged in successfully.`);
    return { success: true };
  };

  const register = async (email: string, password: string) => {
    if (!supabase) return { success: false, message: "Supabase not configured." };
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return { success: false, message: error.message };

    addLog("Register", `New user ${email} registered and pending approval.`);
    return { success: true };
  };

  const logout = async () => {
    if (!supabase) return;
    if (user) addLog("Logout", `User ${user.username} logged out.`);
    await supabase.auth.signOut();
    setUser(null);
  };

  const deleteUser = async (id: string) => {
    if (user?.role !== "admin" || !supabase) return;
    // Note: Deleting from auth.users requires service_role key or admin API
    // For this demo, we'll just delete from profiles
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (!error) {
      fetchAllUsers();
      addLog("Delete User", `Admin deleted user profile ${id}.`);
    }
  };

  const toggleUserStatus = async (id: string) => {
    if (user?.role !== "admin" || !supabase) return;
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return;

    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !targetUser.isActive })
      .eq("id", id);
    
    if (!error) {
      fetchAllUsers();
      addLog("Toggle Status", `Admin toggled status for ${targetUser.username}.`);
    }
  };

  const approveUser = async (id: string) => {
    if (user?.role !== "admin" || !supabase) return;
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: true })
      .eq("id", id);
    
    if (!error) {
      fetchAllUsers();
      const targetUser = users.find(u => u.id === id);
      addLog("Approve User", `Admin approved user ${targetUser?.username}.`);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      users, 
      logs,
      login, 
      register, 
      logout, 
      deleteUser, 
      toggleUserStatus, 
      approveUser,
      addLog,
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
