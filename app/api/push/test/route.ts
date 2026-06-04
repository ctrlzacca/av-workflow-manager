import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET()
{
  webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("*");

  for (const sub of subs ?? []) {
    await webpush.sendNotification(
      sub.subscription,
      JSON.stringify({
        title: "TEST",
        body: "funziona",
        url: "/",
      })
    );
  }

  return Response.json({ ok: true });
}