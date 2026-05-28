import { useCallback, useEffect, useRef, useState } from "react";
import { contentApi } from "@/lib/cms";

/**
 * Manages a single content block keyed by `key`. Loads on mount, keeps a draft
 * with dirty tracking, and exposes a save handler that PUTs the draft back.
 * Supplies a `defaults` value used when the API returns null (first edit).
 */
export function useCmsSection<T extends object>(key: string, defaults: T) {
  const [draft, setDraft] = useState<T>(defaults);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Track dirty by deep JSON comparison against the last persisted value.
  const persistedRef = useRef<string>(JSON.stringify(defaults));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const block = await contentApi.get<T>(key);
        if (cancelled) return;
        const value = (block.value ?? defaults) as T;
        // Merge with defaults so newly-added fields are populated even if the
        // stored value pre-dates them.
        const merged = { ...defaults, ...(value as object) } as T;
        setDraft(merged);
        persistedRef.current = JSON.stringify(merged);
      } catch (e) {
        if (!cancelled) setError(`Не удалось загрузить: ${e}`);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const dirty = JSON.stringify(draft) !== persistedRef.current;

  const update = useCallback((patch: Partial<T>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await contentApi.put<T>(key, draft);
      persistedRef.current = JSON.stringify(draft);
      setSavedAt(res.updatedAt ?? Date.now());
    } catch (e) {
      setError(`Не удалось сохранить: ${e}`);
    } finally {
      setSaving(false);
    }
  }, [draft, key]);

  return {
    draft,
    update,
    setDraft,
    loaded,
    dirty,
    saving,
    savedAt,
    error,
    save,
  };
}
