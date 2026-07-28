"use client";

import { useEffect, useState } from "react";

export function usePwaInstall() {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // già installata?
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault(); // fondamentale
      setPromptEvent(e);
    };

    window.addEventListener("beforeinstallprompt", handler as any);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setPromptEvent(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler as any);
    };
  }, []);

  async function install() {
    if (!promptEvent) return false;

    promptEvent.prompt();

    const choice = await promptEvent.userChoice;

    setPromptEvent(null);

    return choice.outcome === "accepted";
  }

  return {
    canInstall: !!promptEvent,
    isInstalled,
    install,
  };
}