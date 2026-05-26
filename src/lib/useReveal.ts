import { useEffect, useRef, useState } from "react";

interface UseRevealOptions {
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
}

export function useReveal<T extends HTMLElement>(opts: UseRevealOptions = {}) {
  const { rootMargin = "0px 0px -10% 0px", threshold = 0.15, once = true } = opts;
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) io.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { rootMargin, threshold },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, threshold, once]);

  return { ref, visible };
}
