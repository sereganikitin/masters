import { useEffect, useState } from "react";
import { overlaysApi, type Overlay, type OverlayScope } from "./overlays";

export function useOverlays(scope: OverlayScope, scopeKey: string = "") {
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    overlaysApi
      .list(scope, scopeKey)
      .then((list) => {
        if (!cancelled) {
          setOverlays(list);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scope, scopeKey]);

  return { overlays, loading, error };
}
