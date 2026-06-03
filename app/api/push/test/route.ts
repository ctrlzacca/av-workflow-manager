import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("*");

  const sub = subs?.[0];

  await webpush.sendNotification(
    sub.subscription,
    JSON.stringify({
      title: "TEST",
      body: "funziona",
      url: "/",
    })
  );

  return Response.json({ ok: true });
}