import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const IDLE_MS = 90_000;
const HERO_PATH = "/";
const ACTIVITY_EVENTS = ["pointerdown", "touchstart", "wheel", "keydown"] as const;

export function useIdleReturn(idleMs: number = IDLE_MS) {
  const nav = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname === HERO_PATH) return;

    let timer: number | undefined;
    const reset = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => nav(HERO_PATH), idleMs);
    };

    reset();
    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, reset, { passive: true });
    }
    return () => {
      if (timer) window.clearTimeout(timer);
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, reset);
      }
    };
  }, [pathname, nav, idleMs]);
}
