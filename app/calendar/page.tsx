"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import type { Project } from "@/app/types/project";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

const PRIORITY_COLOR: Record<Project["priority"], string> = {
  Low: "bg-white/30",
  Medium: "bg-yellow-400",
  High: "bg-red-400",
};

const BUILTIN_LOGOS: Record<string, string> = {
  Ableton: "/ableton.svg",
  TouchDesigner: "/touchdesigner.svg",
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  // 0=domenica → convertiamo in 0=lunedì
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const router = useRouter();
  const today = new Date();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // ── LOAD ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadProjects() {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .not("deadline", "is", null)
        .neq("deadline", "");

      if (error) { console.error("Error loading projects:", error.message); }
      setProjects(data ?? []);
      setLoading(false);
    }
    loadProjects();
  }, []);

  // ── NAVIGATION ────────────────────────────────────────────────────────────

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else { setCurrentMonth(m => m - 1); }
    setSelectedDay(null);
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else { setCurrentMonth(m => m + 1); }
    setSelectedDay(null);
  }

  function goToToday() {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDay(today.getDate());
  }

  // ── CALENDAR GRID ─────────────────────────────────────────────────────────

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  // ── PROJECTS PER DAY ──────────────────────────────────────────────────────

  function getProjectsForDay(day: number): Project[] {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return projects.filter((p) => p.deadline === dateStr);
  }

  const selectedProjects = selectedDay ? getProjectsForDay(selectedDay) : [];

  // ── CATEGORY ICON ─────────────────────────────────────────────────────────

  function getCategoryIcon(categoryName: string) {
    if (BUILTIN_LOGOS[categoryName]) {
      return (
        <img
          src={BUILTIN_LOGOS[categoryName]}
          alt={categoryName}
          className="w-3.5 h-3.5 object-contain invert opacity-60"
        />
      );
    }
    return <span className="text-xs">📁</span>;
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-black border-b border-white/8 px-5 pt-14 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold tracking-tight">Calendario</h1>
          <button
            onClick={goToToday}
            className="text-xs text-white/40 border border-white/10 px-3 py-1.5 rounded-lg hover:border-white/30 transition-colors"
          >
            Oggi
          </button>
        </div>

        {/* MONTH NAVIGATION */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center"
          >
            <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h2 className="text-base font-semibold">
            {MONTHS[currentMonth]} {currentYear}
          </h2>

          <button
            onClick={nextMonth}
            className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center"
          >
            <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto pb-36">

        {/* DAYS OF WEEK */}
        <div className="grid grid-cols-7 px-3 pt-4 pb-2">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs text-white/25 font-medium py-1">
              {d}
            </div>
          ))}
        </div>

        {/* CALENDAR GRID */}
        <div className="grid grid-cols-7 px-3 gap-y-1">
          {Array.from({ length: totalCells }).map((_, idx) => {
            const day = idx - firstDay + 1;
            const isValid = day >= 1 && day <= daysInMonth;
            const isToday = isValid &&
              day === today.getDate() &&
              currentMonth === today.getMonth() &&
              currentYear === today.getFullYear();
            const isSelected = isValid && day === selectedDay;
            const dayProjects = isValid ? getProjectsForDay(day) : [];

            return (
              <button
                key={idx}
                onClick={() => isValid && setSelectedDay(day === selectedDay ? null : day)}
                disabled={!isValid}
                className={`relative flex flex-col items-center py-2 rounded-xl transition-all ${
                  isSelected ? "bg-white/15" :
                  isToday ? "bg-white/8" : ""
                } ${isValid ? "hover:bg-white/8" : ""}`}
              >
                {/* DAY NUMBER */}
                <span className={`text-sm font-medium ${
                  !isValid ? "invisible" :
                  isToday ? "text-white" :
                  isSelected ? "text-white" :
                  "text-white/60"
                }`}>
                  {isValid ? day : ""}
                </span>

                {/* TODAY DOT */}
                {isToday && (
                  <span className="w-1 h-1 rounded-full bg-white mt-0.5" />
                )}

                {/* PROJECT DOTS */}
                {isValid && dayProjects.length > 0 && !isToday && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-8">
                    {dayProjects.slice(0, 3).map((p, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${PRIORITY_COLOR[p.priority]}`}
                      />
                    ))}
                  </div>
                )}

                {/* COUNT se più di 3 */}
                {isValid && dayProjects.length > 3 && (
                  <span className="text-white/30 text-xs">+{dayProjects.length - 3}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* SELECTED DAY PROJECTS */}
        {selectedDay && (
          <div className="px-5 mt-4">
            <h3 className="text-sm font-semibold text-white/50 mb-3">
              {selectedDay} {MONTHS[currentMonth]}
            </h3>

            {selectedProjects.length === 0 ? (
              <p className="text-white/20 text-sm py-4 text-center">Nessun progetto in scadenza</p>
            ) : (
              <div className="space-y-2">
                {selectedProjects.map((project) => (
                  <Link
                    key={project.slug}
                    href={`/projects/${project.slug}`}
                    className="flex items-center gap-3 border border-white/10 rounded-xl px-4 py-3 hover:border-white/20 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      {getCategoryIcon(project.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{project.title}</p>
                      <p className="text-xs text-white/30 mt-0.5">{project.category}</p>
                    </div>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLOR[project.priority]}`} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TUTTI I PROGETTI CON DEADLINE QUESTO MESE */}
        {!selectedDay && (
          <div className="px-5 mt-4">
            <h3 className="text-sm font-semibold text-white/50 mb-3">
              Scadenze di {MONTHS[currentMonth]}
            </h3>

            {loading ? (
              <p className="text-white/20 text-sm text-center py-4">Caricamento...</p>
            ) : (
              (() => {
                const monthProjects = projects.filter((p) => {
                  if (!p.deadline) return false;
                  const d = new Date(p.deadline);
                  return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
                }).sort((a, b) => a.deadline.localeCompare(b.deadline));

                return monthProjects.length === 0 ? (
                  <p className="text-white/20 text-sm text-center py-4">Nessuna scadenza questo mese</p>
                ) : (
                  <div className="space-y-2">
                    {monthProjects.map((project) => {
                      const day = parseInt(project.deadline.split("-")[2]);
                      const isPast = new Date(project.deadline) < today;
                      return (
                        <Link
                          key={project.slug}
                          href={`/projects/${project.slug}`}
                          className="flex items-center gap-3 border border-white/10 rounded-xl px-4 py-3 hover:border-white/20 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                            <span className={`text-sm font-bold ${isPast ? "text-red-400" : "text-white/60"}`}>
                              {day}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{project.title}</p>
                            <p className={`text-xs mt-0.5 ${isPast ? "text-red-400/60" : "text-white/30"}`}>
                              {isPast ? "Scaduto" : project.category}
                            </p>
                          </div>
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLOR[project.priority]}`} />
                        </Link>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-black/95 backdrop-blur border-t border-white/8 flex items-center justify-around px-6 pb-10 pt-4">
        <Link href="/" className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-xs text-white/30 font-medium">Home</span>
        </Link>

        <div className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xs text-white/60 font-medium">Calendario</span>
        </div>

        <div className="w-14 h-14" />

        <Link href="/settings" className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-xs text-white/30 font-medium">Settings</span>
        </Link>
      </nav>
    </main>
  );
}