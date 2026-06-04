import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // fallback safety
  if (!user) {
    return NextResponse.json(
      { error: "No user (check auth flow)" },
      { status: 401 }
    );
  }

  const { subscription, daysBefore } = await req.json();

  if (!subscription?.endpoint) {
    return NextResponse.json(
      { error: "Invalid subscription (missing endpoint)" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("push_subscriptions")
    .upsert(
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