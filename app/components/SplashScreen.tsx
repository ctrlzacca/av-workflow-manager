"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function SplashScreen() {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    async function check() {
      // aspetta almeno 1.5 secondi per mostrare il logo
      const [{ data }] = await Promise.all([
        supabase.auth.getSession(),
        new Promise((r) => setTimeout(r, 1500)),
      ]);

      setVisible(false);

      if (data.session) {
        router.push("/");
      } else {
        router.push("/login");
      }
    }
    check();
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
          <span className="text-black font-bold text-2xl">AV</span>
        </div>
        <p className="text-white font-semibold text-lg tracking-tight">AV Workflow Manager</p>
      </div>
    </div>
  );
}