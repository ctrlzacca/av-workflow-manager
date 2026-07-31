import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const GITHUB_OWNER = "ctrlzacca";
const GITHUB_REPO = "av-workflow-manager";
const API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

export async function GET(req: Request) {
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

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");
  const sha = searchParams.get("sha");
  if (!path || !sha) return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });

  const token = process.env.GITHUB_TOKEN;
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };

  const res = await fetch(
    `${API}/contents/${path}?ref=${sha}`,
    { headers }
  );

  if (!res.ok) return NextResponse.json({ error: "Versione non trovata" }, { status: 404 });

  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf-8");

  return NextResponse.json({ content });
}