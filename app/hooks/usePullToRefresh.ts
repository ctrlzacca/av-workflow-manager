"use client";

import { useRef, useState } from "react";

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const MAX_PULL = 80;
  const TRIGGER_THRESHOLD = 60;

  function onTouchStart(e: React.TouchEvent) {
    // attiva solo se siamo in cima alla pagina
    if (window.scrollY > 0) {
      isPulling.current = false;
      return;
    }
    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!isPulling.current || isRefreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      setPullDistance(Math.min(MAX_PULL, diff * 0.5));
    }
  }

  async function onTouchEnd() {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= TRIGGER_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(MAX_PULL * 0.6);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  }

  return {
    pullDistance,
    isRefreshing,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}