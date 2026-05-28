// Frontend client for the CMS endpoints (content blocks, special formats,
// construction gallery, uploads). Auth/token is reused from overlays.ts.

import { adminAuth } from "./overlays";

function authHeaders(): HeadersInit {
  const t = adminAuth.get();
  return t ? { authorization: `Bearer ${t}` } : {};
}

// ─────────────────────────────────────────────────────────────────────────────
// Content blocks — flat key/JSON store
// ─────────────────────────────────────────────────────────────────────────────

export interface ContentBlock<T = unknown> {
  key: string;
  value: T | null;
  updatedAt: number | null;
}

export const contentApi = {
  async get<T = unknown>(key: string): Promise<ContentBlock<T>> {
    const res = await fetch(`/api/content/${encodeURIComponent(key)}`);
    if (!res.ok) throw new Error(`Content fetch failed: ${res.status}`);
    return (await res.json()) as ContentBlock<T>;
  },

  async list(): Promise<ContentBlock[]> {
    const res = await fetch(`/api/content`);
    if (!res.ok) throw new Error(`Content list failed: ${res.status}`);
    return (await res.json()) as ContentBlock[];
  },

  async put<T>(key: string, value: T): Promise<ContentBlock<T>> {
    const res = await fetch(`/api/content/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify({ value }),
    });
    if (!res.ok) throw new Error(`Content save failed: ${res.status}`);
    return (await res.json()) as ContentBlock<T>;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Special formats — list/CRUD
// ─────────────────────────────────────────────────────────────────────────────

export interface SpecialFormat {
  id: number;
  tag: string;
  title: string;
  body: string;
  image: string;
  detailsUrl: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export const specialFormatsApi = {
  async list(): Promise<SpecialFormat[]> {
    const res = await fetch(`/api/special-formats`);
    if (!res.ok) throw new Error(`Formats fetch failed: ${res.status}`);
    return (await res.json()) as SpecialFormat[];
  },

  async create(
    f: Omit<SpecialFormat, "id" | "createdAt" | "updatedAt">,
  ): Promise<SpecialFormat> {
    const res = await fetch(`/api/special-formats`, {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify(f),
    });
    if (!res.ok) throw new Error(`Format create failed: ${res.status}`);
    return (await res.json()) as SpecialFormat;
  },

  async update(
    id: number,
    patch: Partial<SpecialFormat>,
  ): Promise<SpecialFormat> {
    const res = await fetch(`/api/special-formats/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`Format update failed: ${res.status}`);
    return (await res.json()) as SpecialFormat;
  },

  async remove(id: number): Promise<void> {
    const res = await fetch(`/api/special-formats/${id}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    });
    if (!res.ok && res.status !== 204) throw new Error(`Format delete failed: ${res.status}`);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Construction gallery
// ─────────────────────────────────────────────────────────────────────────────

export interface ConstructionEntry {
  id: number;
  year: number;
  month: number;
  title: string;
  body: string;
  bullets: string[];
  photos: string[];
  videoUrl: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export const constructionApi = {
  async list(): Promise<ConstructionEntry[]> {
    const res = await fetch(`/api/construction`);
    if (!res.ok) throw new Error(`Construction fetch failed: ${res.status}`);
    return (await res.json()) as ConstructionEntry[];
  },

  async create(
    e: Omit<ConstructionEntry, "id" | "createdAt" | "updatedAt">,
  ): Promise<ConstructionEntry> {
    const res = await fetch(`/api/construction`, {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify(e),
    });
    if (!res.ok) throw new Error(`Construction create failed: ${res.status}`);
    return (await res.json()) as ConstructionEntry;
  },

  async update(
    id: number,
    patch: Partial<ConstructionEntry>,
  ): Promise<ConstructionEntry> {
    const res = await fetch(`/api/construction/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`Construction update failed: ${res.status}`);
    return (await res.json()) as ConstructionEntry;
  },

  async remove(id: number): Promise<void> {
    const res = await fetch(`/api/construction/${id}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    });
    if (!res.ok && res.status !== 204)
      throw new Error(`Construction delete failed: ${res.status}`);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// File uploads — multipart, returns served URL
// ─────────────────────────────────────────────────────────────────────────────

export interface UploadResult {
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`/api/uploads`, {
    method: "POST",
    headers: { ...authHeaders() }, // do NOT set content-type; browser fills boundary
    body: form,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Upload failed: ${res.status} ${msg}`);
  }
  return (await res.json()) as UploadResult;
}
