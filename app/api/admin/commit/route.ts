import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const GITHUB_OWNER = "ctrlzacca";
const GITHUB_REPO = "av-workflow-manager";
const GITHUB_BRANCH = "main";

export async function POST(req: Request) {
  // ── AUTH CHECK ────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  // ── BODY ──────────────────────────────────────────────────────────────────
  const { path, content, message } = await req.json();

  if (!path || content === undefined || !message) {
    return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "GitHub token non configurato" }, { status: 500 });
  }

  const apiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;

  try {
    // ── 1. Recupera lo SHA del file attuale (se esiste) ────────────────────
    let sha: string | undefined;
    const getRes = await fetch(`${apiBase}?ref=${GITHUB_BRANCH}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (getRes.ok) {
      const getData = await getRes.json();
      sha = getData.sha;
    }
    // se getRes non è ok (404), il file non esiste ancora — va bene, lo creiamo

    // ── 2. Crea/aggiorna il file ─────────────────────────────────────────────
    const contentBase64 = Buffer.from(content, "utf-8").toString("base64");

    const putRes = await fetch(apiBase, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content: contentBase64,
        branch: GITHUB_BRANCH,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!putRes.ok) {
      const errData = await putRes.json();
      return NextResponse.json({ error: errData.message ?? "Errore GitHub API" }, { status: putRes.status });
    }

    const putData = await putRes.json();

    return NextResponse.json({
      ok: true,
      commitUrl: putData.commit?.html_url,
      sha: putData.content?.sha,
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Errore sconosciuto" }, { status: 500 });
  }
}