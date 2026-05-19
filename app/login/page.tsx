"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleReset() {
    if (!email.trim()) return;
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://av-workflow-manager.vercel.app/reset-password",
    });
    setResetSent(true);
    setLoading(false);
  }

  // ── LOGIN ─────────────────────────────────────────────────────────────────

  async function handleLogin() {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email o password errati.");
      setLoading(false);
      return;
    }

    router.push("/");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleLogin();
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-center px-6">

      <div className="w-full max-w-sm">

        {/* HEADER */}
        <h1 className="text-2xl font-bold tracking-tight mb-1">AV Workflow Manager</h1>
        <p className="text-[var(--text)]/30 text-sm mb-10">Accedi al tuo account</p>

        {/* FORM */}
        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Email"
            className="w-full p-4 bg-white/5 border border-[color:var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text)]/20 focus:outline-none focus:border-white/30 text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Password"
            className="w-full p-4 bg-white/5 border border-[color:var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text)]/20 focus:outline-none focus:border-white/30 text-sm"
          />
        </div>

        {/* ERROR */}
        {error && (
          <p className="text-red-400 text-xs mt-3">{error}</p>
        )}

        {/* LOGIN BUTTON */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full mt-5 py-4 bg-white text-black rounded-xl font-semibold text-sm disabled:opacity-50 transition-opacity"
        >
          {loading ? "Accesso..." : "Accedi"}
        </button>
        
              {!resetMode ? (
        <button onClick={() => setResetMode(true)} className="text-[var(--text)]/30 text-xs hover:text-[var(--text)]/60 transition-colors">
          Password dimenticata?
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          {resetSent ? (
            <p className="text-green-400 text-xs text-center">Email inviata! Controlla la casella.</p>
          ) : (
            <>
              <p className="text-[var(--text)]/40 text-xs">Inserisci la tua email per ricevere il link di reset.</p>
              <button onClick={handleReset} disabled={loading} className="w-full py-3 border border-[color:var(--border)] rounded-xl text-[var(--text)]/60 text-sm">
                Invia link di reset
              </button>
            </>
          )}
          <button onClick={() => { setResetMode(false); setResetSent(false); }} className="text-[var(--text)]/20 text-xs hover:text-[var(--text)]/40 w-full text-center">
            Torna al login
          </button>
        </div>
      )}

        {/* REGISTER LINK */}
        <p className="text-center text-[var(--text)]/30 text-xs mt-6">
          Non hai un account?{" "}
          <Link href="/register" className="text-[var(--text)]/60 hover:text-[var(--text)] transition-colors">
            Registrati
          </Link>
        </p>
      </div>
    </main>
  );
}