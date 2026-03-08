"use client";

import React, { useEffect } from "react";

export default function CanvaReturnUrlPage() {
  useEffect(() => {
    // This page is called by Canva after publishing
    // We can try to close the window if it's a popup, or redirect
    if (window.opener) {
      window.opener.postMessage({ type: "CANVA_PUBLISH_SUCCESS" }, "*");
      window.close();
    } else {
      window.location.href = "/designer";
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-stone-900">Publishing Successful</h1>
        <p className="text-stone-500 mt-2">You can close this window now.</p>
      </div>
    </div>
  );
}
