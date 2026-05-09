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
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">

      <div className="w-full max-w-sm">

        {/* HEADER */}
        <h1 className="text-2xl font-bold tracking-tight mb-1">AV Workflow Manager</h1>
        <p className="text-white/30 text-sm mb-10">Accedi al tuo account</p>

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
            placeholder="Password"
            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 text-sm"
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

        {/* REGISTER LINK */}
        <p className="text-center text-white/30 text-xs mt-6">
          Non hai un account?{" "}
          <Link href="/register" className="text-white/60 hover:text-white transition-colors">
            Registrati
          </Link>
        </p>
      </div>
    </main>
  );
}