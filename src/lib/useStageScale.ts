import { useEffect, useRef } from "react";

const STAGE_W = 1920;
const STAGE_H = 1080;

/**
 * Fit-to-viewport scaling for kiosk screens (Hero/Genplan/Section/Floor/Apartment/Tour).
 *   scale = min(viewport_w / 1920, viewport_h / 1080)
 *
 * - On a 1920×1080 panel — exact 1:1.
 * - On non-16:9 windows — letter/pillarbox; the outer background fills the gap.
 *   No scroll. Every UI control stays inside the viewport regardless of size.
 *
 * For long, content-heavy pages (About, Catalog) — render them OUTSIDE the
 * Stage so they get normal responsive web layout instead of being scaled.
 */
export function useStageScale<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const apply = () => {
      const scaleX = window.innerWidth / STAGE_W;
      const scaleY = window.innerHeight / STAGE_H;
      const scale = Math.min(scaleX, scaleY);
      const offsetX = (window.innerWidth - STAGE_W * scale) / 2;
      const offsetY = (window.innerHeight - STAGE_H * scale) / 2;
      el.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    };

    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  return ref;
}
