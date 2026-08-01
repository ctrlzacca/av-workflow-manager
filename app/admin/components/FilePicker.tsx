"use client";

import { useEffect, useState } from "react";

type TreeNode = {
  name: string;
  path: string;
  isFile: boolean;
  children?: Record<string, TreeNode>;
};

function buildTree(paths: string[]): Record<string, TreeNode> {
  const root: Record<string, TreeNode> = {};

  for (const path of paths) {
    const parts = path.split("/");
    let current = root;
    let currentPath = "";

    parts.forEach((part, i) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = i === parts.length - 1;

      if (!current[part]) {
        current[part] = { name: part, path: currentPath, isFile, children: isFile ? undefined : {} };
      }
      if (!isFile) current = current[part].children!;
    });
  }

  return root;
}

export default function FilePicker({
  onSelect,
  onClose,
}: {
  onSelect: (path: string) => void;
  onClose: () => void;
}) {
  const [allFiles, setAllFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/tree")
      .then((r) => r.json())
      .then((data) => { setAllFiles(data.files ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const tree = buildTree(allFiles);

  // naviga alla cartella corrente nell'albero
  let node: Record<string, TreeNode> = tree;
  for (const part of currentPath) {
    node = node[part]?.children ?? {};
  }

  const entries = Object.values(node).sort((a, b) => {
    if (a.isFile !== b.isFile) return a.isFile ? 1 : -1; // cartelle prima
    return a.name.localeCompare(b.name);
  });

  // ricerca globale (ignora navigazione cartelle)
  const searchResults = search.trim()
    ? allFiles.filter((f) => f.toLowerCase().includes(search.toLowerCase())).slice(0, 30)
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg)] flex flex-col">
      {/* HEADER */}
      <div className="px-5 pt-14 pb-3 border-b border-[color:var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Seleziona file</p>
          <button onClick={onClose} className="text-xs text-[var(--text)]/40 px-3 py-1.5">
            Chiudi
          </button>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca file per nome..."
          className="w-full bg-[var(--card)] border border-[color:var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text)] focus:outline-none"
        />

        {/* BREADCRUMB */}
        {!search && currentPath.length > 0 && (
          <div className="flex items-center gap-1 mt-2 text-xs text-[var(--text)]/40 overflow-x-auto scrollbar-none">
            <button onClick={() => setCurrentPath([])} className="flex-shrink-0 hover:text-[var(--text)]">root</button>
            {currentPath.map((part, i) => (
              <span key={i} className="flex items-center gap-1 flex-shrink-0">
                <span>/</span>
                <button
                  onClick={() => setCurrentPath(currentPath.slice(0, i + 1))}
                  className="hover:text-[var(--text)]"
                >
                  {part}
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto px-5 py-3">
        {loading ? (
          <p className="text-[var(--text)]/20 text-sm text-center mt-10">Caricamento struttura repo...</p>
        ) : searchResults ? (
          <div className="space-y-1">
            {searchResults.length === 0 ? (
              <p className="text-[var(--text)]/20 text-sm text-center mt-10">Nessun file trovato</p>
            ) : (
              searchResults.map((f) => (
                <button
                  key={f}
                  onClick={() => onSelect(f)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[var(--card)] transition-colors flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5 text-[var(--text)]/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs font-mono truncate text-[var(--text)]/70">{f}</span>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {entries.map((entry) => (
              <button
                key={entry.path}
                onClick={() => {
                  if (entry.isFile) onSelect(entry.path);
                  else setCurrentPath([...currentPath, entry.name]);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[var(--card)] transition-colors flex items-center gap-2"
              >
                {entry.isFile ? (
                  <svg className="w-3.5 h-3.5 text-[var(--text)]/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-[var(--text)]/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                )}
                <span className={`text-sm truncate ${entry.isFile ? "font-mono text-xs text-[var(--text)]/70" : "text-[var(--text)]"}`}>
                  {entry.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}