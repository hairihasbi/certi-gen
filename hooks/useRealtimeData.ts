"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export function useRealtimeData() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [systemStats, setSystemStats] = useState({ totalTemplates: 0, totalCertificates: 0 });

  const fetchSystemStats = useCallback(async () => {
    if (!supabase || !user || user.role !== "admin") return;
    
    const [templatesRes, certsRes] = await Promise.all([
      supabase.from("templates").select("*", { count: "exact", head: true }),
      supabase.from("certificates").select("*", { count: "exact", head: true })
    ]);

    setSystemStats({
      totalTemplates: templatesRes.count || 0,
      totalCertificates: certsRes.count || 0
    });
  }, [user]);

  const fetchTemplates = useCallback(async () => {
    if (!supabase || !user) return;
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTemplates(data);
    }
  }, [user]);

  const fetchCertificates = useCallback(async () => {
    if (!supabase || !user) return;
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCertificates(data);
    }
  }, [user]);

  useEffect(() => {
    if (!supabase || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const promises = [fetchTemplates(), fetchCertificates()];
    if (user.role === "admin") promises.push(fetchSystemStats());
    
    Promise.all(promises).finally(() => {
      setIsLoading(false);
    });

    // Subscribe to templates
    const templatesSubscription = supabase
      .channel("templates_changes")
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "templates", 
          filter: user.role === "admin" ? undefined : `user_id=eq.${user.id}` 
        },
        () => {
          fetchTemplates();
          if (user.role === "admin") fetchSystemStats();
        }
      )
      .subscribe();

    // Subscribe to certificates
    const certificatesSubscription = supabase
      .channel("certificates_changes")
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "certificates", 
          filter: user.role === "admin" ? undefined : `user_id=eq.${user.id}` 
        },
        () => {
          fetchCertificates();
          if (user.role === "admin") fetchSystemStats();
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(templatesSubscription);
        supabase.removeChannel(certificatesSubscription);
      }
    };
  }, [user, fetchTemplates, fetchCertificates, fetchSystemStats]);

  const saveTemplate = async (name: string, elements: any[], backgroundUrl: string | null) => {
    if (!supabase || !user) return { error: "Not connected" };

    const { data, error } = await supabase
      .from("templates")
      .upsert({
        user_id: user.id,
        name,
        elements,
        background_url: backgroundUrl,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    return { data, error };
  };

  const saveCertificate = async (templateId: string, recipientData: any, certNumber: string, imageUrl: string, digitalHash: string) => {
    if (!supabase || !user) return { error: "Not connected" };

    const { data, error } = await supabase
      .from("certificates")
      .insert({
        template_id: templateId,
        user_id: user.id,
        recipient_data: recipientData,
        certificate_number: certNumber,
        image_url: imageUrl,
        digital_hash: digitalHash,
      })
      .select()
      .single();

    return { data, error };
  };

  const saveSetting = async (id: string, value: any) => {
    if (!supabase || !user) return { error: "Not connected" };

    const { data, error } = await supabase
      .from("settings")
      .upsert({
        id,
        value,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    return { data, error };
  };

  const fetchSetting = async (id: string) => {
    if (!supabase) return { error: "Not connected" };

    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", id)
      .single();

    return { data, error };
  };

  return {
    templates,
    certificates,
    systemStats,
    isLoading,
    saveTemplate,
    saveCertificate,
    saveSetting,
    fetchSetting,
    fetchTemplates,
    refresh: () => Promise.all([fetchTemplates(), fetchCertificates(), fetchSystemStats()]),
  };
}
