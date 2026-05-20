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
  const [registered, setRegistered] = useState(false);

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

    const { error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
    setError("Errore durante la registrazione. Riprova.");
    setLoading(false);
    return;
    }

    setRegistered(true);
    setLoading(false);
    }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleRegister();
    }

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-center px-6">

      <div className="w-full max-w-sm">

        {/* HEADER */}
        <h1 className="text-2xl font-bold tracking-tight mb-1">AV Workflow Manager</h1>
        <p className="text-[var(--text)]/30 text-sm mb-10">Crea il tuo account</p>

        {/* FORM */}
        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Email"
            className="w-full p-4 bg-white/5 border border-[color:var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text)]/20 focus:outline-none focus:border-[color:var(--border)]/30 text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Password (min. 6 caratteri)"
            className="w-full p-4 bg-white/5 border border-[color:var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text)]/20 focus:outline-none focus:border-[color:var(--border)]/30 text-sm"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Conferma password"
            className="w-full p-4 bg-white/5 border border-[color:var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text)]/20 focus:outline-none focus:border-[color:var(--border)]/30 text-sm"
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
          className="w-full mt-5 py-4 bg-white text-[var(--text)] rounded-xl font-semibold text-sm disabled:opacity-50 transition-opacity"
        >
          {loading ? "Registrazione..." : "Crea account"}
        </button>
        {registered && (
        <div className="mt-5 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
        <p className="text-green-400 text-sm font-medium">Account creato!</p>
        <p className="text-[var(--text)]/40 text-xs mt-1">
        Controlla la tua casella email e clicca sul link di verifica per attivare l'account.
        </p>
        <button
        onClick={() => router.push("/login")}
        className="mt-3 text-xs text-[var(--text)]/60 hover:text-[var(--text)] transition-colors"
        >
        Vai al login →
        </button>
        </div>
        )}

        {/* LOGIN LINK */}
        <p className="text-center text-[var(--text)]/30 text-xs mt-6">
          Hai già un account?{" "}
          <Link href="/login" className="text-[var(--text)]/60 hover:text-[var(--text)] transition-colors">
            Accedi
          </Link>
        </p>
      </div>
    </main>
  );
}