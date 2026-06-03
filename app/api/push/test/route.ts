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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

for (const sub of subs) {
  try {
            await webpush.sendNotification(
            subs[0].subscription,
            JSON.stringify({
                title: "TEST",
                body: "funziona ancora",
                url: "/",
            })
            );
  } catch (err) {
    console.log("Subscription non valida, la elimino:", sub.id);

    await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?id=eq.${sub.id}`, {
      method: "DELETE",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
  }
}

  return Response.json({ ok: true });
}