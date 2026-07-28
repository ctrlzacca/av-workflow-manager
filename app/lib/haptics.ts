export function hapticFeedback(style: "light" | "medium" | "success" = "light") {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;
  if (!("vibrate" in navigator)) return;
  const patterns = {
    light: 10,
    medium: 20,
    success: [10, 30, 10],
  };
  navigator.vibrate(patterns[style]);
}