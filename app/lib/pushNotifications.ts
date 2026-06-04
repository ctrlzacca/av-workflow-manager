function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

if (!VAPID_PUBLIC_KEY) {
  throw new Error("Missing VAPID public key");
}

export async function subscribeToPush(daysBefore: number): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const reg = await navigator.serviceWorker.ready;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const body = sub.toJSON();

  // 👇 recuperiamo user dal frontend (FONDAMENTALE)
  const userRes = await fetch("/api/auth/me");
  const { user } = await userRes.json();

  if (!user) {
    console.error("No user found");
    return false;
  }

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription: body,
      daysBefore,
      userId: user.id,
    }),
  });

  return true;
}

export async function unsubscribeFromPush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();

  if (sub) {
    await sub.unsubscribe();
    await fetch("/api/push/unsubscribe", { method: "POST" });
  }
}