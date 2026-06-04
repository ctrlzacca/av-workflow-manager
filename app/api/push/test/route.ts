import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("*");

  console.log("SUBS:", subs);

  if (error) {
    console.log("SUPABASE ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  const sub = subs?.[0];

  if (!sub) {
    return Response.json({ ok: true, message: "no subscriptions" });
  }

try {
  const result = await webpush.sendNotification(
    sub.subscription,
    JSON.stringify({
      title: "TEST",
      body: "funziona",
      url: "/",
    })
  );

  console.log("PUSH SENT OK:", result);
} catch (err) {
  console.log("PUSH ERROR:", err);
}

  return Response.json({ ok: true });
}
