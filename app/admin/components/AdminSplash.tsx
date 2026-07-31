"use client";

import { useEffect, useState } from "react";

export default function AdminSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[100]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
          <span className="text-black font-bold text-xl">A</span>
        </div>
        <p className="text-white font-semibold text-lg tracking-tight">AVWM Admin</p>
      </div>
    </div>
  );
}