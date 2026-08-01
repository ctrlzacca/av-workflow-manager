import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const GITHUB_OWNER = "ctrlzacca";
const GITHUB_REPO = "av-workflow-manager";
const GITHUB_BRANCH = "main";
const API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

export async function GET() {
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

  const token = process.env.GITHUB_TOKEN;
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };

  // sha dell'ultimo commit
  const refRes = await fetch(`${API}/git/ref/heads/${GITHUB_BRANCH}`, { headers });
  const refData = await refRes.json();

  // albero completo ricorsivo
  const treeRes = await fetch(`${API}/git/trees/${refData.object.sha}?recursive=1`, { headers });
  const treeData = await treeRes.json();

  const files = (treeData.tree ?? [])
    .filter((item: any) => item.type === "blob")
    .filter((item: any) => !item.path.startsWith("node_modules/") && !item.path.startsWith(".next/") && !item.path.startsWith(".git/"))
    .map((item: any) => item.path)
    .sort();

  return NextResponse.json({ files });
}