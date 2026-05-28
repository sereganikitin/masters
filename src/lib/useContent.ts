import { useEffect, useState } from "react";
import { contentApi } from "@/lib/cms";

/**
 * Public-side hook: load a CMS content block with a fallback default.
 *
 * Returns the resolved content immediately as `fallback`, then re-renders with
 * the server value once it arrives. If the server doesn't have anything saved
 * yet, the fallback stays. Newly-added fields in `fallback` shine through
 * stored objects via a shallow merge.
 */
export function useContent<T extends object>(key: string, fallback: T): T {
  const [content, setContent] = useState<T>(fallback);

  useEffect(() => {
    let cancelled = false;
    contentApi
      .get<T>(key)
      .then((block) => {
        if (cancelled) return;
        if (block.value == null) return;
        setContent({ ...fallback, ...(block.value as object) } as T);
      })
      .catch(() => {
        /* keep fallback on failure */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return content;
}
