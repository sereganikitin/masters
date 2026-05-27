import { useEffect, useRef } from "react";

const STAGE_W = 1920;
const STAGE_H = 1080;

/**
 * Scales the kiosk stage to fill the viewport width (never less, never more).
 * Vertical overflow is intentional — the outer container scrolls so kiosks with
 * a shorter viewport (1920×900 laptops in browser) can still reach the bottom
 * UI controls. On the actual 1920×1080 kiosk the scale lands at exactly 1.
 */
export function useStageScale<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const apply = () => {
      const scale = window.innerWidth / STAGE_W;
      el.style.transform = `scale(${scale})`;
      // Reserve enough vertical space in the document for the scaled stage so
      // the outer container can scroll when the viewport is shorter than scaled H.
      el.style.height = `${STAGE_H}px`;
      el.style.width = `${STAGE_W}px`;
      const parent = el.parentElement;
      if (parent) {
        parent.style.minHeight = `${STAGE_H * scale}px`;
      }
    };

    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  return ref;
}
