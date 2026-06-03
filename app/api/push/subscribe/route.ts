import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("USER IN API:", user?.id);

  if (!user) {
    return NextResponse.json({ error: "No user" }, { status: 401 });
  }

  const { subscription, daysBefore } = await req.json();

  const { data, error } = await supabase
    .from("push_subscriptions")
    .insert({
      user_id: user.id,
      subscription,
      days_before: daysBefore,
    })
    .select();

  if (error) {
    console.log("SUPABASE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}