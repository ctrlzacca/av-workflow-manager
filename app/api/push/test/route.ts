import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const email = process.env.VAPID_EMAIL;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!email || !publicKey || !privateKey) {
    throw new Error("Missing VAPID env variables");
  }

  webpush.setVapidDetails(email, publicKey, privateKey);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("*");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (!subs || subs.length === 0) {
    return Response.json({ ok: true, message: "no subscriptions" });
  }

  console.log("SUBS COUNT:", subs.length);

  let successCount = 0;
  let failCount = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        sub.subscription,
        JSON.stringify({
          title: "TEST",
          body: "Il test è andato a buon fine!",
          url: "/",
        })
      );

      successCount++;
    } catch (err) {
      console.log("PUSH ERROR:", err);
      failCount++;
    }
  }

  console.log("PUSH RESULT:", { successCount, failCount });

  return Response.json({
    ok: true,
    sent: successCount,
    failed: failCount,
  });
}