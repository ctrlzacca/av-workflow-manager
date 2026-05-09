"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── REGISTER ──────────────────────────────────────────────────────────────

  async function handleRegister() {
    if (!email.trim() || !password.trim()) return;
    setError("");

    if (password !== confirm) {
      setError("Le password non coincidono.");
      return;
    }

    if (password.length < 6) {
      setError("La password deve essere di almeno 6 caratteri.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError("Errore durante la registrazione. Riprova.");
      setLoading(false);
      return;
    }

    router.push("/");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleRegister();
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">

      <div className="w-full max-w-sm">

        {/* HEADER */}
        <h1 className="text-2xl font-bold tracking-tight mb-1">AV Workflow Manager</h1>
        <p className="text-white/30 text-sm mb-10">Crea il tuo account</p>

        {/* FORM */}
        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Email"
            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Password (min. 6 caratteri)"
            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 text-sm"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Conferma password"
            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 text-sm"
          />
        </div>

        {/* ERROR */}
        {error && (
          <p className="text-red-400 text-xs mt-3">{error}</p>
        )}

        {/* REGISTER BUTTON */}
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full mt-5 py-4 bg-white text-black rounded-xl font-semibold text-sm disabled:opacity-50 transition-opacity"
        >
          {loading ? "Registrazione..." : "Crea account"}
        </button>

        {/* LOGIN LINK */}
        <p className="text-center text-white/30 text-xs mt-6">
          Hai già un account?{" "}
          <Link href="/login" className="text-white/60 hover:text-white transition-colors">
            Accedi
          </Link>
        </p>
      </div>
    </main>
  );
}