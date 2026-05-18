"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (password !== confirm) { setError("Le password non coincidono."); return; }
    if (password.length < 6) { setError("Minimo 6 caratteri."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError("Errore. Riprova."); setLoading(false); return; }
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1">Nuova password</h1>
        <p className="text-white/30 text-sm mb-8">Scegli una nuova password per il tuo account.</p>
        <div className="space-y-3">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nuova password" className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 text-sm" />
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Conferma password" className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 text-sm" />
        </div>
        {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
        <button onClick={handleReset} disabled={loading} className="w-full mt-5 py-4 bg-white text-black rounded-xl font-semibold text-sm disabled:opacity-50">
          {loading ? "Salvataggio..." : "Salva password"}
        </button>
      </div>
    </main>
  );
}