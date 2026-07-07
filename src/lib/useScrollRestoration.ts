import { useEffect, useLayoutEffect, type RefObject } from "react";
import { useLocation } from "react-router-dom";

// Remembers the scroll offset of an inner scroll container per history entry,
// so navigating away (e.g. opening a lot card or the 3D tour) and coming back
// lands you exactly where you left off — not at the top and not on the home
// page. Keyed by React Router's location.key, which is stable across a
// back/forward (POP) navigation but unique for every fresh push.
const positions = new Map<string, number>();

export function useScrollRestoration(ref: RefObject<HTMLElement>) {
  const { key } = useLocation();

  // Restore before paint so there's no visible jump.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const saved = positions.get(key);
    if (saved != null) el.scrollTop = saved;
  }, [key, ref]);

  // Keep the latest offset recorded while the user scrolls.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => positions.set(key, el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [key, ref]);
}
