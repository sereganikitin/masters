export type OverlayScope = "genplan" | "section" | "floor";
export type OverlayEntity = "section" | "floor" | "apartment";

export interface Overlay {
  id: number;
  scope: OverlayScope;
  scopeKey: string;
  entityType: OverlayEntity;
  entityId: string;
  label: string;
  points: [number, number][];
  color: string;
  createdAt: number;
  updatedAt: number;
}

interface RawOverlay extends Omit<Overlay, "points"> {
  points: string;
}

function parse(raw: RawOverlay): Overlay {
  let points: [number, number][] = [];
  try {
    const parsed = JSON.parse(raw.points);
    if (Array.isArray(parsed)) points = parsed as [number, number][];
  } catch {
    // ignore malformed
  }
  return { ...raw, points };
}

const TOKEN_KEY = "masters_admin_token";

export const adminAuth = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
  async check(token: string): Promise<boolean> {
    const res = await fetch("/api/auth/check", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    // 2xx → парсим ответ; 4xx/5xx → бросаем ошибку с конкретикой,
    // чтобы UI смог отличить "сервер недоступен" от "неверный токен".
    if (!res.ok) {
      throw new Error(`AUTH_HTTP_${res.status}`);
    }
    const data = (await res.json()) as { ok: boolean };
    return Boolean(data.ok);
  },
};

function authHeaders(): HeadersInit {
  const t = adminAuth.get();
  return t ? { authorization: `Bearer ${t}` } : {};
}

export const overlaysApi = {
  async list(scope?: OverlayScope, scopeKey?: string): Promise<Overlay[]> {
    const qs = new URLSearchParams();
    if (scope) qs.set("scope", scope);
    if (scopeKey !== undefined) qs.set("scopeKey", scopeKey);
    const res = await fetch(`/api/overlays?${qs}`);
    if (!res.ok) throw new Error(`Overlays fetch failed: ${res.status}`);
    const raw = (await res.json()) as RawOverlay[];
    return raw.map(parse);
  },

  async create(
    o: Omit<Overlay, "id" | "createdAt" | "updatedAt">,
  ): Promise<Overlay> {
    const res = await fetch("/api/overlays", {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify(o),
    });
    if (!res.ok) throw new Error(`Create failed: ${res.status}`);
    return parse((await res.json()) as RawOverlay);
  },

  async update(id: number, patch: Partial<Overlay>): Promise<Overlay> {
    const res = await fetch(`/api/overlays/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`Update failed: ${res.status}`);
    return parse((await res.json()) as RawOverlay);
  },

  async remove(id: number): Promise<void> {
    const res = await fetch(`/api/overlays/${id}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    });
    if (!res.ok && res.status !== 204) throw new Error(`Delete failed: ${res.status}`);
  },
};
