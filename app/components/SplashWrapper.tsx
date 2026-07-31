"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function SplashWrapper() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // non mostrare la splash globale nelle pagine admin
  if (pathname?.startsWith("/admin")) return null;

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[100] transition-opacity duration-500">
      <div className="flex flex-col items-center gap-4">
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