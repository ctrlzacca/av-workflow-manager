import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

const { data: subs } = await supabase
  .from("push_subscriptions")
  .select("*");

console.log("SUBS:", subs);

  if (!subs?.length) return Response.json({ error: "no subs" });

  for (const sub of subs) {
    await webpush.sendNotification(
      sub.subscription,
      JSON.stringify({
        title: "TEST PUSH 🔥",
        body: "Se vedi questo, tutto funziona",
      })
    );
  }

  return Response.json({ ok: true });
}