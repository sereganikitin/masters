import { useEffect, useRef } from "react";

const STAGE_W = 1920;
const STAGE_H = 1080;

export function useStageScale<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const apply = () => {
      const scaleX = window.innerWidth / STAGE_W;
      const scaleY = window.innerHeight / STAGE_H;
      // Cover: pick the larger scale so the stage always fills the viewport on both
      // axes. The shorter axis overflows slightly; outer container clips it.
      const scale = Math.max(scaleX, scaleY);
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
