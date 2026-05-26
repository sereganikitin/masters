import { useEffect, useRef } from "react";

/**
 * Applies a parallax translateY to the element based on scroll position
 * within the nearest scrollable ancestor. Speed > 0 = slower than scroll (background feel),
 * speed < 0 = faster (foreground emphasis). Range typically -0.5 ... 0.5.
 */
export function useParallax<T extends HTMLElement>(speed: number = 0.2) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Find scrollable ancestor (overflow-y: auto/scroll)
    const findScroller = (n: HTMLElement | null): HTMLElement | Window => {
      let cur = n;
      while (cur && cur !== document.body) {
        const overflowY = getComputedStyle(cur).overflowY;
        if (overflowY === "auto" || overflowY === "scroll") return cur;
        cur = cur.parentElement;
      }
      return window;
    };

    const scroller = findScroller(el.parentElement);
    let raf = 0;

    const update = () => {
      const scrollTop =
        scroller === window ? window.scrollY : (scroller as HTMLElement).scrollTop;
      const rect = el.getBoundingClientRect();
      const viewportH = scroller === window ? window.innerHeight : (scroller as HTMLElement).clientHeight;
      // Center-relative progress -1..1 within viewport
      const center = rect.top + rect.height / 2;
      const progress = (center - viewportH / 2) / viewportH;
      const offset = -progress * speed * 100;
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
      void scrollTop;
    };

    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed]);

  return ref;
}
