"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Collaborator = {
  id: string;
  project_slug: string;
  owner_id: string;
  collaborator_email: string;
  collaborator_id: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  project?: { title: string };
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function TeamPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<Collaborator[]>([]);
  const [myCollaborators, setMyCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  // ── INVITE MODAL ──────────────────────────────────────────────────────────
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteProject, setInviteProject] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [activity, setActivity] = useState<any[]>([]);

  // ── LOAD ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {

    const activityRes = await supabase
  .from("project_activity")
  .select("*, project:projects(title)")
  .order("created_at", { ascending: false })
  .limit(50);

    setActivity(activityRes.data ?? []);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setUser(user);

    const [projectsRes, sharedRes, collabRes] = await Promise.all([
      supabase.from("projects").select("title, slug").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("project_collaborators").select("*, project:projects(title)").eq("collaborator_id", user.id),
      supabase.from("project_collaborators").select("*, project:projects(title)").eq("owner_id", user.id).order("created_at", { ascending: false }),
    ]);

    setMyProjects(projectsRes.data ?? []);
    setSharedWithMe(sharedRes.data ?? []);
    setMyCollaborators(collabRes.data ?? []);
    setLoading(false);
  }

  // ── INVITE ────────────────────────────────────────────────────────────────

  async function sendInvite() {
    if (!inviteEmail.trim() || !inviteProject) return;
    setInviteLoading(true);
    setInviteError("");

    // cerca l'utente per email tramite API
    const res = await fetch(`/api/users/find?email=${encodeURIComponent(inviteEmail.trim())}`);
    const { userId } = await res.json();

    // controlla se esiste già una collaborazione
    const { data: existingList } = await supabase
      .from("project_collaborators")
      .select("id")
      .eq("project_slug", inviteProject)
      .eq("collaborator_email", inviteEmail.trim());

    if (existingList && existingList.length > 0) {
      setInviteError("Hai già invitato questo utente per questo progetto.");
      setInviteLoading(false);
      return;
    }

    const { error } = await supabase.from("project_collaborators").insert({
    project_slug: inviteProject,
    owner_id: user.id,
    collaborator_email: inviteEmail.trim(),
    collaborator_id: userId ?? null,
    status: "pending",
    });

if (error) {
  setInviteError("Errore nell'invio dell'invito.");
} else {
  // notifica l'utente invitato
  if (userId) {
    fetch("https://yjcozojajbvtykxbveou.supabase.co/functions/v1/notify-collaborators", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqY296b2phamJ2dHlreGJ2ZW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDAyMDUsImV4cCI6MjA5MzQ3NjIwNX0.-1bvIw4lEgVs2hgczR4645A9oOmrXKASHJf9fQSsefk`,
      },
      body: JSON.stringify({
        project_slug: inviteProject,
        project_title: myProjects.find((p) => p.slug === inviteProject)?.title ?? inviteProject,
        modified_by_email: user.email,
        field: "invito",
        notify_only: [userId],
      }),
    });
  }
  setInviteSuccess(true);
  setInviteEmail("");
  setInviteProject("");
  setTimeout(() => {
    setShowInvite(false);
    setInviteSuccess(false);
    loadAll();
  }, 1500);
}
}

  // ── ACCEPT / REJECT ───────────────────────────────────────────────────────

async function respondToInvite(id: string, status: "accepted" | "rejected") {
    console.log("respondToInvite called:", id, status);
  await supabase.from("project_collaborators").update({ status }).eq("id", id);

  // trova i dettagli della collaborazione per notificare l'owner
  const collab = sharedWithMe.find((c) => c.id === id);
    console.log("collab found:", collab);
  console.log("ownerSubsRes will check user_id:", collab?.owner_id);
  if (collab) {
    // trova la subscription dell'owner
    const ownerSubsRes = await supabase
      .from("push_subscriptions")
      .select("user_id")
      .eq("user_id", collab.owner_id)
      .limit(1);

    if ((ownerSubsRes.data ?? []).length > 0) {
      fetch("https://yjcozojajbvtykxbveou.supabase.co/functions/v1/notify-collaborators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqY296b2phamJ2dHlreGJ2ZW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDAyMDUsImV4cCI6MjA5MzQ3NjIwNX0.-1bvIw4lEgVs2hgczR4645A9oOmrXKASHJf9fQSsefk`,
        },
        body: JSON.stringify({
          project_slug: collab.project_slug,
          project_title: (collab.project as any)?.title ?? collab.project_slug,
          modified_by_email: user.email,
          field: status === "accepted" ? "invito_accettato" : "invito_rifiutato",
          notify_only: [collab.owner_id],
        }),
      });
    }
  }

  loadAll();
}

  // ── REMOVE COLLABORATOR ───────────────────────────────────────────────────

  async function removeCollaborator(id: string, email: string) {
    const confirmed = window.confirm(`Rimuovere ${email} dalla collaborazione?`);
    if (!confirmed) return;
    await supabase.from("project_collaborators").delete().eq("id", id);
    loadAll();
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[var(--bg)] border-b border-[color:var(--border)] px-5 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Team</h1>
            <p className="text-[var(--text)]/30 text-xs mt-0.5">Collaborazioni e progetti condivisi</p>
          </div>
          <button
            onClick={() => { setShowInvite(true); setInviteError(""); setInviteSuccess(false); }}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl text-sm font-semibold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Invita
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-5 py-5 pb-36 space-y-8">

        {loading ? (
          <p className="text-[var(--text)]/20 text-sm text-center mt-16">Caricamento...</p>
        ) : (
          <>

            {/* ── INVITI RICEVUTI ── */}
            <section>
              <h2 className="text-xs font-semibold text-[var(--text)]/30 uppercase tracking-widest mb-3">
                Inviti ricevuti
              </h2>

              {sharedWithMe.length === 0 ? (
                <p className="text-[var(--text)]/20 text-sm py-4 text-center">Nessun invito ricevuto</p>
              ) : (
                <div className="space-y-2">
                  {sharedWithMe.map((collab) => (
                    <div key={collab.id} className="border border-[color:var(--border)] rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {(collab.project as any)?.title ?? collab.project_slug}
                          </p>
                          <p className="text-xs text-[var(--text)]/40 mt-0.5">
                            {collab.status === "pending" ? "In attesa di risposta" :
                             collab.status === "accepted" ? "Accettato" : "Rifiutato"}
                          </p>
                        </div>
                        {collab.status === "pending" && (
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => respondToInvite(collab.id, "rejected")}
                              className="px-3 py-1.5 text-xs border border-[color:var(--border)] rounded-xl text-[var(--text)]/40 hover:text-red-400 hover:border-red-400/30 transition-colors"
                            >
                              Rifiuta
                            </button>
                            <button
                              onClick={() => respondToInvite(collab.id, "accepted")}
                              className="px-3 py-1.5 text-xs bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl font-medium"
                            >
                              Accetta
                            </button>
                          </div>
                        )}
                        {collab.status === "accepted" && (
                          <Link
                            href={`/projects/${collab.project_slug}`}
                            className="px-3 py-1.5 text-xs border border-[color:var(--border)] rounded-xl text-[var(--text)]/50 flex-shrink-0"
                          >
                            Apri →
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── PROGETTI CHE HO CONDIVISO ── */}
            <section>
              <h2 className="text-xs font-semibold text-[var(--text)]/30 uppercase tracking-widest mb-3">
                Progetti condivisi da me
              </h2>

              {myCollaborators.length === 0 ? (
                <p className="text-[var(--text)]/20 text-sm py-4 text-center">
                  Non hai ancora condiviso nessun progetto
                </p>
                
              ) : (
                <div className="space-y-2">
                  {myCollaborators.map((collab) => (
                    <div key={collab.id} className="border border-[color:var(--border)] rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {(collab.project as any)?.title ?? collab.project_slug}
                          </p>
                          <p className="text-xs text-[var(--text)]/40 mt-0.5">
                            {collab.collaborator_email}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              collab.status === "accepted" ? "bg-green-400" :
                              collab.status === "rejected" ? "bg-red-400" :
                              "bg-yellow-400"
                            }`} />
                            <span className="text-xs text-[var(--text)]/30">
                              {collab.status === "accepted" ? "Accettato" :
                               collab.status === "rejected" ? "Rifiutato" :
                               "In attesa"}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeCollaborator(collab.id, collab.collaborator_email)}
                          className="text-[var(--text)]/20 hover:text-red-400 transition-colors w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    
                  ))}
                </div>
              )}
            </section>
              {/* ── CRONOLOGIA MODIFICHE ── */}
<section>
  <h2 className="text-xs font-semibold text-[var(--text)]/30 uppercase tracking-widest mb-3">
    Cronologia modifiche
  </h2>

  {activity.length === 0 ? (
    <p className="text-[var(--text)]/20 text-sm py-4 text-center">Nessuna attività ancora</p>
  ) : (
    <div className="space-y-2">
      {activity.map((a) => (
        <div key={a.id} className="border border-[color:var(--border)] rounded-2xl px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {(a.project as any)?.title ?? a.project_slug}
              </p>
              <p className="text-xs text-[var(--text)]/40 mt-0.5">
                {a.user_email} · campo <span className="font-mono">{a.field}</span>
              </p>
            </div>
            <p className="text-xs text-[var(--text)]/25 flex-shrink-0">
              {new Date(a.created_at).toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )}
</section>
          </>
        )}
      </div>

      {/* INVITE MODAL */}
      {showInvite && (
        <div className="fixed inset-0 z-20 bg-[var(--bg)]/80 backdrop-blur flex items-end">
          <div className="w-full bg-[var(--bg)] border-t border-[color:var(--border)] p-6 rounded-t-3xl space-y-4">
            <div className="w-10 h-1 bg-[var(--card)] rounded-full mx-auto" />
            <h2 className="text-base font-semibold">Invita collaboratore</h2>

            {inviteSuccess ? (
              <p className="text-green-400 text-sm text-center py-4">✓ Invito inviato!</p>
            ) : (
              <>
                <div>
                  <p className="text-xs text-[var(--text)]/40 mb-1.5">Progetto</p>
                  <select
                    value={inviteProject}
                    onChange={(e) => setInviteProject(e.target.value)}
                    className="w-full bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)] text-sm px-3 py-3 rounded-xl focus:outline-none"
                  >
                    <option value="">Seleziona progetto...</option>
                    {myProjects.map((p) => (
                      <option key={p.slug} value={p.slug}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-xs text-[var(--text)]/40 mb-1.5">Email collaboratore</p>
                  <input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@esempio.com"
                    type="email"
                    className="w-full bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)] text-sm px-3 py-3 rounded-xl focus:outline-none focus:border-[color:var(--border)]/50"
                  />
                </div>

                {inviteError && (
                  <p className="text-red-400 text-xs">{inviteError}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowInvite(false); setInviteEmail(""); setInviteProject(""); }}
                    className="flex-1 py-3 border border-[color:var(--border)] rounded-xl text-[var(--text)]/40 text-sm"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={sendInvite}
                    disabled={inviteLoading || !inviteEmail.trim() || !inviteProject}
                    className="flex-1 py-3 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl text-sm font-semibold disabled:opacity-40"
                  >
                    {inviteLoading ? "Invio..." : "Invia invito"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-[var(--bg)]/95 backdrop-blur border-t border-[color:var(--border)] flex items-center justify-around px-6 pb-10 pt-4">
        <Link href="/" className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--text)]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-xs text-[var(--text)]/30 font-medium">Home</span>
        </Link>
        <Link href="/calendar" className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--text)]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xs text-[var(--text)]/30 font-medium">Calendario</span>
        </Link>
        <div className="w-10 h-10" />
        <Link href="/tools" className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--text)]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5h7v6H4V5zm9 0h7v4h-7V5zM4 13h7v6H4v-6zm9-2h7v8h-7v-8z"/>
            </svg>
          </div>
          <span className="text-xs text-[var(--text)]/30 font-medium">Tools</span>
        </Link>
        <Link href="/team" className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-xs text-[var(--text)]/60 font-medium">Team</span>
        </Link>
      </nav>
    </main>
  );
}