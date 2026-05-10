"use client";

import { useEffect, useState } from "react";

export default function SplashWrapper() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

return (
  <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[100]">
    <div className="flex flex-col items-center gap-6">
      <img
        src="/icon-512.png"
        alt="AV Workflow"
        className="w-28 h-28 rounded-3xl"
      />
      <p className="text-white font-bold text-2xl tracking-tight">AV Workflow Manager</p>
    </div>
  </div>
);
}