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
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No user" }, { status: 401 });
  }

  const { subscription, daysBefore } = await req.json();

  if (!subscription?.endpoint) {
    return NextResponse.json(
      { error: "Invalid subscription" },
      { status: 400 }
    );
  }

  // UPSERT PER DEVICE (endpoint = identity del device)
  const { data, error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      subscription,
      endpoint: subscription.endpoint,
      days_before: daysBefore,
    },
    {
      onConflict: "endpoint",
    }
  );

  console.log("UPSERT RESULT:", { data, error });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}