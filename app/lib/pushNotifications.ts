function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

if (!VAPID_PUBLIC_KEY) {
  throw new Error("Missing VAPID public key");
}

export async function subscribeToPush(daysBefore: number): Promise<boolean> {
  console.log("subscribeToPush called", daysBefore);
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.log("No service worker or PushManager");
    return false;
  }
  console.log("Requesting permission...");
  const permission = await Notification.requestPermission();
  console.log("Permission:", permission);
  if (permission !== "granted") return false;

  const reg = await navigator.serviceWorker.ready;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
  });

  const body = sub.toJSON();

  // 👉 USER preso direttamente da Supabase client browser
  const { createClient } = await import("@supabase/supabase-js");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error("No user logged in");
    return false;
  }

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription: body,
      daysBefore,
      userId: user.id,
    }),
  });

  const json = await res.json();
  console.log("SUBSCRIBE RESPONSE:", json);

  return true;
}

export async function unsubscribeFromPush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();

  if (sub) {
    await sub.unsubscribe();

    await fetch("/api/push/unsubscribe", {
      method: "POST",
    });
  }
}