import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// ─── SUPABASE CLIENT ──────────────────────────────────────────────────────────

// Usa auth-helpers per gestire automaticamente le sessioni nei componenti client
export const supabase = createClientComponentClient();