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

export async function subscribeToPush(daysBefore: number, userId: string): Promise<boolean> {
  console.log("subscribeToPush called", daysBefore);
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.log("No service worker or PushManager");
    return false;
  }
  console.log("Requesting permission...");
  const permission = await Notification.requestPermission();
  console.log("Permission:", permission);
  if (permission !== "granted") return false;

try {
  console.log("Getting SW registration...");
  const reg = await navigator.serviceWorker.ready;
  console.log("SW ready:", reg);

  console.log("Subscribing to push...");
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
  });
  console.log("Sub created:", sub);
  console.log("User:", userId);
if (!userId) {
  console.error("No user logged in");
  return false;
}

  const body = sub.toJSON();

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: body, daysBefore, userId: userId }),
  });

  const json = await res.json();
  console.log("SUBSCRIBE RESPONSE:", json);

  return res.ok;

} catch (err) {
  console.error("subscribeToPush FAILED:", err);
  return false;
}
}

export async function unsubscribeFromPush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();

  if (sub) {
    const endpoint = sub.endpoint;
    await sub.unsubscribe();

    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
  }
}