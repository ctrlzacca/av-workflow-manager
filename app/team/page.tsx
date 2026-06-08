      import Link from "next/link";
      
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
        <Link href="/team" className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--text)]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-xs text-[var(--text)]/30 font-medium">Team</span>
        </Link>
      </nav>