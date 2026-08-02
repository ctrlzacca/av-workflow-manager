import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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
  const sha = searchParams.get("sha");
  if (!sha) return NextResponse.json({ error: "sha mancante" }, { status: 400 });

  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  const res = await fetch(
    `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=10`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    return NextResponse.json({ state: "unknown" });
  }

  const data = await res.json();
  const deployment = data.deployments?.find((d: any) => d.meta?.githubCommitSha === sha);

  if (!deployment) {
    return NextResponse.json({ state: "pending" }); // deploy non ancora partito/rilevato
  }

  // stati Vercel: QUEUED, BUILDING, READY, ERROR, CANCELED
  return NextResponse.json({ state: deployment.state, url: deployment.url });
}