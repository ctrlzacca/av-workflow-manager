"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import type { Category } from "@/app/types/project";
import { renderIcon } from "@/app/lib/renderIcon";
import { PRESET_SOFTWARES } from "@/app/lib/presetSoftwares";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const APP_VERSION = "1.0.0";
const GITHUB_URL = "https://github.com/ctrlzacca/av-workflow-manager";

const SORT_OPTIONS = [
  { value: "created_desc", label: "Più recenti" },
  { value: "created_asc", label: "Più vecchi" },
  { value: "priority_desc", label: "Priorità (High → Low)" },
  { value: "priority_asc", label: "Priorità (Low → High)" },
  { value: "deadline_asc", label: "Deadline (urgenti)" },
  { value: "deadline_desc", label: "Deadline (ultimi)" },
];


// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();

  const [defaultCategory, setDefaultCategory] = useState("Ableton");
  const [defaultSort, setDefaultSort] = useState("created_desc");
  const [defaultFilter, setDefaultFilter] = useState("All");
  const [projectCount, setProjectCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState("dark");

  // ── CATEGORIE CUSTOM ──────────────────────────────────────────────────────

  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("📁");
  const [newCatFields, setNewCatFields] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);


  // ── LOAD ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const category = localStorage.getItem("defaultCategory");
    const sort = localStorage.getItem("defaultSort");
    const filter = localStorage.getItem("defaultFilter");
    const savedTheme = localStorage.getItem("theme") || "dark";

    if (category) setDefaultCategory(category);
    if (sort) setDefaultSort(sort);
    if (filter) setDefaultFilter(filter);

    setTheme(savedTheme);

    loadData();
  }, []);

  async function loadData() {
    const { count } = await supabase.from("projects").select("*", { count: "exact", head: true });
    setProjectCount(count ?? 0);

    const { data } = await supabase.from("categories").select("*").order("created_at", { ascending: true });
    setCategories(data ?? []);
  }

  // ── SAVE SETTINGS ─────────────────────────────────────────────────────────

  function saveSettings() {
    localStorage.setItem("defaultCategory", defaultCategory);
    localStorage.setItem("defaultSort", defaultSort);
    localStorage.setItem("defaultFilter", defaultFilter);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }


  function toggleTheme() {
    const html = document.documentElement;
    const newTheme = theme === "dark" ? "light" : "dark";
    html.classList.remove("dark", "light");
    html.classList.add(newTheme);
    localStorage.setItem("theme", newTheme);
    setTheme(newTheme);
  }

  // ── ADD CATEGORY ──────────────────────────────────────────────────────────

  async function addCategory() {
  if (!newCatName.trim()) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const fields = newCatFields
    .split(",")
    .map((f) => f.trim())
    .filter((f) => f.length > 0);

  const isImageIcon = newCatIcon.startsWith("/");

  const { error } = await supabase.from("categories").insert({
    name: newCatName.trim(),
    icon: newCatIcon.trim() || "📁",
    is_image: isImageIcon, // nuovo campo — vedi passo 5
    fields,
    user_id: user.id,
  });

  if (error) { console.error("Error adding category:", error.message); return; }

  setNewCatName("");
  setNewCatIcon("📁");
  setNewCatFields("");
  setShowAddCat(false);
  loadData();
}

  // ── UPDATE CATEGORY ───────────────────────────────────────────────────────

  async function updateCategory() {
    if (!editingCat) return;

    const fields = typeof editingCat.fields === "string"
      ? (editingCat.fields as string).split(",").map((f) => f.trim()).filter((f) => f.length > 0)
      : editingCat.fields;

    const { error } = await supabase
      .from("categories")
      .update({ name: editingCat.name, icon: editingCat.icon, fields, color: editingCat.color })
      .eq("id", editingCat.id);

    if (error) { console.error("Error updating category:", error.message); return; }
    setEditingCat(null);
    loadData();
  }

  // ── DELETE CATEGORY ───────────────────────────────────────────────────────

  async function deleteCategory(cat: Category) {
    const confirmed = window.confirm(`Eliminare la categoria "${cat.name}"? I progetti associati non verranno eliminati.`);
    if (!confirmed) return;

    const { error } = await supabase.from("categories").delete().eq("id", cat.id);
    if (error) { console.error("Error deleting category:", error.message); return; }
    loadData();
  }

  // ── EXPORT ────────────────────────────────────────────────────────────────

  async function exportProjects() {
    const { data, error } = await supabase.from("projects").select("*");
    if (error) { console.error("Export error:", error.message); return; }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `av-workflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── DELETE ALL ────────────────────────────────────────────────────────────

  async function deleteAllProjects() {
    const first = window.confirm("Sei sicuro di voler eliminare TUTTI i progetti?");
    if (!first) return;
    const second = window.confirm("Questa azione è irreversibile. Continuare?");
    if (!second) return;
    await supabase.from("projects").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    setProjectCount(0);
    router.push("/");
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">

      {/* HEADER */}
      <header className="sticky top-0 z-10 bg-[var(--bg)]/95 backdrop-blur border-b border-[color:var(--border)] px-5 pt-14 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="w-9 h-9 rounded-xl bg-[var(--card)] flex items-center justify-center flex-shrink-0"
          >
            <svg className="w-4 h-4 text-[var(--text)]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-bold text-base">Settings</h1>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-5 py-6 pb-36 space-y-8">

        {/* ── PREFERENZE DI DEFAULT ── */}
        <section>
          <h2 className="text-xs font-semibold text-[var(--text)]/30 uppercase tracking-widest mb-3">
            Preferenze di default
          </h2>
          <div className="bg-[var(--card)] border border-[color:var(--border)] rounded-2xl divide-y divide-white/5">
            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <p className="text-sm font-medium">Categoria</p>
                <p className="text-xs text-[var(--text)]/30 mt-0.5">Categoria preselezionata per i nuovi progetti</p>
              </div>
              <select
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value)}
                className="bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)]/60 text-xs px-3 py-2 rounded-xl focus:outline-none"
              >
                {categories.map((cat) => (
                    <option
                  key={cat.id}
                  value={cat.name}
                  className="bg-[var(--bg)]"
                >
                  {cat.name}
                </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <p className="text-sm font-medium">Ordinamento</p>
                <p className="text-xs text-[var(--text)]/30 mt-0.5">Ordine di visualizzazione all'apertura</p>
              </div>
              <select
                value={defaultSort}
                onChange={(e) => setDefaultSort(e.target.value)}
                className="bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)]/60 text-xs px-3 py-2 rounded-xl focus:outline-none max-w-32"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-[var(--bg)]">{o.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <p className="text-sm font-medium">Filtro</p>
                <p className="text-xs text-[var(--text)]/30 mt-0.5">Filtro attivo all'apertura dell'app</p>
              </div>
            <select
              value={defaultFilter}
              onChange={(e) => setDefaultFilter(e.target.value)}
              className="bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)]/60 text-xs px-3 py-2 rounded-xl focus:outline-none"
            >
              <option value="All" className="bg-[var(--bg)]">
                All
              </option>

              {categories.map((cat) => (
                <option
                  key={cat.id}
                  value={cat.name}
                  className="bg-[var(--bg)]"
                >
                  {cat.name}
                </option>
              ))}
            </select>
            </div>
            <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-medium">Tema</p>
              <p className="text-xs text-[var(--text)]/30 mt-0.5">
                Cambia aspetto dell'app
              </p>
            </div>

            <button
              onClick={toggleTheme}
              className="bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)]/60 text-xs px-4 py-2 rounded-xl hover:bg-[var(--card)] transition-colors"
            >
              {theme === "dark" ? "Scuro" : "Chiaro"}
            </button>
          </div>
          </div>

          <button
            onClick={saveSettings}
            className={`w-full mt-3 py-4 rounded-2xl font-semibold text-sm transition-all 
              ${
              saved ? "bg-green-500 text-[var(--text)]" : "bg-[var(--button-bg)] text-[var(--button-text)]"
            }`}
          >
            {saved ? "✓ Salvato" : "Salva preferenze"}
          </button>
        </section>

        {/* ── CATEGORIE CUSTOM ── */}
        <section>
          <h2 className="text-xs font-semibold text-[var(--text)]/30 uppercase tracking-widest mb-3">
            Categorie personalizzate
          </h2>

          <div className="bg-[var(--card)] border border-[color:var(--border)] rounded-2xl divide-y divide-white/5">

            {/* CATEGORIE CUSTOM */}
            {categories.map((cat) => (
              <div key={cat.id}>
                {editingCat?.id === cat.id ? (
                  /* EDIT MODE */
                  <div className="px-4 py-4 space-y-3">
                    <div className="flex gap-2">
                      <input
                        value={editingCat.icon}
                        onChange={(e) => setEditingCat({ ...editingCat, icon: e.target.value })}
                        className="w-12 bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)] text-center text-lg rounded-xl focus:outline-none"
                      />
                      <input
                        value={editingCat.name}
                        onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                        className="flex-1 bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)] text-sm px-3 py-2 rounded-xl focus:outline-none"
                        placeholder="Nome categoria"
                      />
                    </div>
                    <input
                      type="color"
                      value={editingCat.color || "#1a1a2e"}
                      onChange={(e) => setEditingCat({ ...editingCat, color: e.target.value })}
                      className="w-12 h-10 rounded-xl border border-[color:var(--border)] cursor-pointer bg-transparent"
                    />
                    <input
                      value={Array.isArray(editingCat.fields) ? editingCat.fields.join(", ") : editingCat.fields}
                      onChange={(e) => setEditingCat({ ...editingCat, fields: e.target.value.split(",").map(f => f.trim()).filter(f => f) })}
                      className="w-full bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)]/70 text-sm px-3 py-2 rounded-xl focus:outline-none"
                      placeholder="Campi Info (es. Codec, Durata, Formato)"
                    />
                    <p className="text-xs text-[var(--text)]/25">Separa i campi con una virgola</p>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingCat(null)} className="flex-1 py-2 border border-[color:var(--border)] rounded-xl text-[var(--text)]/40 text-xs">Annulla</button>
                      <button onClick={updateCategory} className="flex-1 py-2 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl text-xs font-semibold">Salva</button>
                    </div>
                  </div>
                ) : (
                  /* VIEW MODE */
                  <div className="flex items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {renderIcon(cat.icon, cat.is_image)}
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{cat.name}</p>
                        {cat.fields.length > 0 && (
                          <p className="text-xs text-[var(--text)]/25 truncate mt-0.5">{cat.fields.join(", ")}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setEditingCat(cat)}
                        className="w-8 h-8 rounded-lg bg-[var(--card)] flex items-center justify-center text-[var(--text)]/30 hover:text-[var(--text)] transition-colors text-xs"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => deleteCategory(cat)}
                        className="w-8 h-8 rounded-lg bg-[var(--card)] flex items-center justify-center text-[var(--text)]/30 hover:text-red-400 transition-colors text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {categories.length === 0 && (
              <p className="text-[var(--text)]/20 text-xs text-center py-4">Nessuna categoria personalizzata</p>
            )}
          </div>

          {/* ADD CATEGORY */}
          {showAddCat ? (
            <div className="mt-3 bg-[var(--card)] border border-[color:var(--border)] rounded-2xl p-4 space-y-3">

              {/* PRESET SOFTWARES */}
              <p className="text-xs text-[var(--text)]/30 mb-2">Scegli software</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_SOFTWARES.map((sw) => (
                  <button
                    key={sw.name}
                    onClick={() => {
                      setNewCatName(sw.name);
                      setNewCatIcon(sw.icon);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs transition-all ${
                      newCatName === sw.name ? "border-[color:var(--border)] bg-[var(--card)] text-[var(--text)]" : "border-[color:var(--border)] text-[var(--text)]/40"
                    }`}
                  >
                      {renderIcon(sw.icon, sw.isImage)}
                    {sw.name}
                  </button>
                ))}
              </div>

            {/* OPPURE PERSONALIZZA */}
                <p className="text-xs text-[var(--text)]/30">Oppure personalizza</p>
                <div className="flex gap-2 items-center">
                  
                  <div className="w-12 h-10 flex items-center justify-center bg-[var(--card)] border border-[color:var(--border)] rounded-xl">
                    {renderIcon(newCatIcon, newCatIcon.startsWith("/"))}
                  </div>

                  <input
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)] text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-[color:var(--border)]"
                    placeholder="Nome categoria"
                  />
                </div>
                <input
                  value={newCatFields}
                  onChange={(e) => setNewCatFields(e.target.value)}
                  className="w-full bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)]/70 text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-[color:var(--border)]"
                  placeholder="Campi Info (es. Codec, Durata, Formato)"
                />
                <p className="text-xs text-[var(--text)]/25">Separa i campi con una virgola</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowAddCat(false); setNewCatName(""); setNewCatIcon("📁"); setNewCatFields(""); }}
                    className="flex-1 py-3 border border-[color:var(--border)] rounded-xl text-[var(--text)]/40 text-sm"
                  >
                    Annulla
                  </button>
                  <button onClick={addCategory} className="flex-1 py-3 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl text-sm font-semibold">
                    Crea
                  </button>
                </div>
              </div>
                  ) : (
              <button
                onClick={() => setShowAddCat(true)}
                className="
                  w-full mt-3 py-4
                  bg-[var(--button-bg)]
                  text-[var(--button-text)]
                  border border-[color:var(--border)]
                  rounded-2xl
                  text-sm
                  transition-colors
                "
              >
                + Nuova categoria
              </button>
                  )}
                </section>

        {/* ── GESTIONE DATI ── */}
        <section>
          <h2 className="text-xs font-semibold text-[var(--text)]/30 uppercase tracking-widest mb-3">
            Gestione dati
          </h2>
          <div className="bg-[var(--card)] border border-[color:var(--border)] rounded-2xl divide-y divide-white/5">
            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <p className="text-sm font-medium">Esporta progetti</p>
                <p className="text-xs text-[var(--text)]/30 mt-0.5">{projectCount} progetti · backup JSON</p>
              </div>
              <button onClick={exportProjects} className="bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)]/60 text-xs px-4 py-2 rounded-xl hover:bg-[var(--card)] transition-colors">
                Esporta
              </button>
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <p className="text-sm font-medium text-red-400/80">Elimina tutto</p>
                <p className="text-xs text-[var(--text)]/30 mt-0.5">Rimuove tutti i progetti dal database</p>
              </div>
              <button onClick={deleteAllProjects} className="bg-red-400/10 border border-red-400/20 text-red-400/70 text-xs px-4 py-2 rounded-xl hover:bg-red-400/20 transition-colors">
                Elimina
              </button>
            </div>
          </div>
        </section>

        {/* ── INFO APP ── */}
        <section>
          <h2 className="text-xs font-semibold text-[var(--text)]/30 uppercase tracking-widest mb-3">
            Info app
          </h2>
          <div className="bg-[var(--card)] border border-[color:var(--border)] rounded-2xl divide-y divide-white/5">
            <div className="flex items-center justify-between px-4 py-4">
              <p className="text-sm font-medium">Versione</p>
              <span className="text-xs text-[var(--text)]/30">{APP_VERSION}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <p className="text-sm font-medium">Repository</p>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                GitHub →
              </a>
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <p className="text-sm font-medium">Progetti salvati</p>
              <span className="text-xs text-[var(--text)]/30">{projectCount}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-medium text-red-400/80">Logout</p>
              <p className="text-xs text-[var(--text)]/30 mt-0.5">Esci dal tuo account</p>
            </div>
              <button
              onClick={async () => {
              await supabase.auth.signOut();
              router.push("/login");
              }}
              className="bg-red-400/10 border border-red-400/20 text-red-400/70 text-xs px-4 py-2 rounded-xl hover:bg-red-400/20 transition-colors"
              >
              Logout
              </button>
            </div>
          </div>
        </section>
              {/* ── APP FOOTER INFO ── */}
      <section className="mt-10 px-1">
        <div className="border-t border-[color:var(--border)] pt-5 flex items-center gap-4">
          
          <img
            src="/icon-512.png"
            alt="AV Workflow"
            className="w-10 h-10 rounded-xl opacity-80"
          />

          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text)]/70">
              AV Workflow Manager
            </p>

            <p className="text-xs text-[var(--text)]/30 leading-relaxed">
              © 2026 Matteo Zaccarella<br />
              Logo design by Federica Gandolfo
            </p>
          </div>

        </div>
      </section>
      </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-[var(--bg)]/95 backdrop-blur border-t border-[color:var(--border)] flex items-center justify-around px-6 pb-10 pt-4">
        <Link href="/" className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--text)]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-xs text-[var(--text)]/30 font-medium">Home</span>
        </Link>
        <Link href="/calendar" className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--text)]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xs text-[var(--text)]/30 font-medium">Calendario</span>
        </Link>
        <div className="w-10 h-10" />
        <Link href="/tools" className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--text)]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5h7v6H4V5zm9 0h7v4h-7V5zM4 13h7v6H4v-6zm9-2h7v8h-7v-8z"/>
            </svg>
          </div>
          <span className="text-xs text-[var(--text)]/30 font-medium">Tools</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-xs text-[var(--text)]/30 font-medium">Settings</span>
        </Link>
      </nav>
    </main>
  );
}