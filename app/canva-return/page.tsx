"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

function CanvaReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const jwt = searchParams.get("correlation_jwt");
    
    if (!jwt) {
      // If no JWT, we can still redirect but maybe it's less secure
      setStatus("success");
      const timer = setTimeout(() => router.replace("/designer"), 2000);
      return () => clearTimeout(timer);
    }

    const verifyJwt = async () => {
      try {
        const res = await fetch(`/api/auth/canva/verify-jwt?correlation_jwt=${jwt}`);
        const data = await res.json();
        
        if (data.success) {
          setStatus("success");
          setTimeout(() => router.replace("/designer"), 2000);
        } else {
          setStatus("error");
          setErrorMsg(data.error || "Verification failed");
        }
      } catch (err) {
        setStatus("error");
        setErrorMsg("Unexpected error during verification");
      }
    };

    verifyJwt();
  }, [router, searchParams]);

  return (
    <div className="max-w-md w-full bg-white rounded-[32px] p-10 border border-stone-200 shadow-xl text-center">
      {status === "verifying" && (
        <>
          <div className="w-20 h-20 bg-stone-50 text-stone-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Verifying...</h2>
          <p className="text-stone-500 leading-relaxed">
            Securing your connection with Canva...
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Design Success!</h2>
          <p className="text-stone-500 mb-8 leading-relaxed">
            Your Canva design has been successfully processed. Returning you to the designer...
          </p>
          <div className="flex items-center justify-center gap-2 text-stone-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Redirecting...</span>
          </div>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Verification Error</h2>
          <p className="text-stone-500 mb-8 leading-relaxed">
            {errorMsg || "We couldn't verify your return from Canva."}
          </p>
          <button 
            onClick={() => router.replace("/designer")}
            className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-colors"
          >
            Return to Designer
          </button>
        </>
      )}
    </div>
  );
}

export default function CanvaReturnPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
      <Suspense fallback={
        <div className="max-w-md w-full bg-white rounded-[32px] p-10 border border-stone-200 shadow-xl text-center">
          <div className="w-20 h-20 bg-stone-50 text-stone-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Loading...</h2>
        </div>
      }>
        <CanvaReturnContent />
      </Suspense>
    </div>
  );
}
