import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const GITHUB_OWNER = "ctrlzacca";
const GITHUB_REPO = "av-workflow-manager";
const GITHUB_BRANCH = "main";
const API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

type FileChange = { path: string; content: string };

export async function POST(req: Request) {
  // ── AUTH ──────────────────────────────────────────────────────────────────
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

  const { files, message } = await req.json() as { files: FileChange[]; message: string };

  if (!files?.length || !message?.trim()) {
    return NextResponse.json({ error: "Nessun file o messaggio mancante" }, { status: 400 });
  }

  const token = process.env.GITHUB_TOKEN;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  try {
    // ── 1. SHA dell'ultimo commit sul branch ────────────────────────────────
    const refRes = await fetch(`${API}/git/ref/heads/${GITHUB_BRANCH}`, { headers });
    if (!refRes.ok) throw new Error("Impossibile leggere il branch");
    const refData = await refRes.json();
    const latestCommitSha = refData.object.sha;

    // ── 2. SHA del tree base ─────────────────────────────────────────────────
    const commitRes = await fetch(`${API}/git/commits/${latestCommitSha}`, { headers });
    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    // ── 3. Crea un blob per ogni file modificato ────────────────────────────
    const blobs = await Promise.all(
      files.map(async (f) => {
        const blobRes = await fetch(`${API}/git/blobs`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            content: Buffer.from(f.content, "utf-8").toString("base64"),
            encoding: "base64",
          }),
        });
        const blobData = await blobRes.json();
        return { path: f.path, sha: blobData.sha };
      })
    );

    // ── 4. Crea il nuovo tree ────────────────────────────────────────────────
    const treeRes = await fetch(`${API}/git/trees`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: blobs.map((b) => ({
          path: b.path,
          mode: "100644",
          type: "blob",
          sha: b.sha,
        })),
      }),
    });
    const treeData = await treeRes.json();
    if (!treeRes.ok) throw new Error(treeData.message ?? "Errore creazione tree");

    // ── 5. Crea il commit ────────────────────────────────────────────────────
    const newCommitRes = await fetch(`${API}/git/commits`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message,
        tree: treeData.sha,
        parents: [latestCommitSha],
      }),
    });
    const newCommitData = await newCommitRes.json();
    if (!newCommitRes.ok) throw new Error(newCommitData.message ?? "Errore creazione commit");

    // ── 6. Aggiorna il ref del branch ────────────────────────────────────────
    const updateRefRes = await fetch(`${API}/git/refs/heads/${GITHUB_BRANCH}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ sha: newCommitData.sha }),
    });
    if (!updateRefRes.ok) {
      const errData = await updateRefRes.json();
      throw new Error(errData.message ?? "Errore aggiornamento branch");
    }

    return NextResponse.json({
      ok: true,
      commitSha: newCommitData.sha,
      commitUrl: newCommitData.html_url,
      filesCount: files.length,
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Errore sconosciuto" }, { status: 500 });
  }
}