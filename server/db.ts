import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

export interface Overlay {
  id: number;
  scope: "genplan" | "section" | "floor";
  scopeKey: string;
  entityType: "section" | "floor" | "apartment";
  entityId: string;
  label: string;
  points: string; // JSON-stringified [number, number][]
  color: string;
  createdAt: number;
  updatedAt: number;
}

export interface ContentRow {
  key: string;
  value: string; // JSON-stringified
  updatedAt: number;
}

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

export interface ConstructionEntry {
  id: number;
  year: number;
  month: number; // 1..12
  title: string;
  body: string;
  bullets: string; // JSON-stringified string[]
  photos: string; // JSON-stringified string[]
  videoUrl: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

const DB_DIR = path.resolve(import.meta.dirname, "..", "data");
const DB_PATH = path.join(DB_DIR, "admin.db");

mkdirSync(DB_DIR, { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS overlays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scope TEXT NOT NULL,
    scope_key TEXT NOT NULL DEFAULT '',
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    points TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#0061A6',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_overlays_scope ON overlays(scope, scope_key);
  CREATE INDEX IF NOT EXISTS idx_overlays_entity ON overlays(entity_type, entity_id);

  CREATE TABLE IF NOT EXISTS content (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS special_formats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    details_url TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS construction_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    bullets TEXT NOT NULL DEFAULT '[]',
    photos TEXT NOT NULL DEFAULT '[]',
    video_url TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_construction_period ON construction_entries(year DESC, month DESC);
`);

const rowToOverlay = (r: Record<string, unknown>): Overlay => ({
  id: r.id as number,
  scope: r.scope as Overlay["scope"],
  scopeKey: r.scope_key as string,
  entityType: r.entity_type as Overlay["entityType"],
  entityId: r.entity_id as string,
  label: r.label as string,
  points: r.points as string,
  color: r.color as string,
  createdAt: r.created_at as number,
  updatedAt: r.updated_at as number,
});

export const overlayQueries = {
  listByScope(scope: string, scopeKey: string): Overlay[] {
    const rows = db
      .prepare("SELECT * FROM overlays WHERE scope = ? AND scope_key = ? ORDER BY id ASC")
      .all(scope, scopeKey) as Record<string, unknown>[];
    return rows.map(rowToOverlay);
  },

  all(): Overlay[] {
    const rows = db.prepare("SELECT * FROM overlays ORDER BY id ASC").all() as Record<
      string,
      unknown
    >[];
    return rows.map(rowToOverlay);
  },

  insert(o: Omit<Overlay, "id" | "createdAt" | "updatedAt">): Overlay {
    const now = Date.now();
    const res = db
      .prepare(
        `INSERT INTO overlays (scope, scope_key, entity_type, entity_id, label, points, color, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(o.scope, o.scopeKey, o.entityType, o.entityId, o.label, o.points, o.color, now, now);
    return this.get(Number(res.lastInsertRowid))!;
  },

  update(id: number, patch: Partial<Omit<Overlay, "id" | "createdAt" | "updatedAt">>): Overlay | undefined {
    const existing = this.get(id);
    if (!existing) return undefined;
    const next = { ...existing, ...patch, updatedAt: Date.now() };
    db.prepare(
      `UPDATE overlays
       SET scope = ?, scope_key = ?, entity_type = ?, entity_id = ?, label = ?, points = ?, color = ?, updated_at = ?
       WHERE id = ?`,
    ).run(
      next.scope,
      next.scopeKey,
      next.entityType,
      next.entityId,
      next.label,
      next.points,
      next.color,
      next.updatedAt,
      id,
    );
    return this.get(id);
  },

  remove(id: number): boolean {
    const res = db.prepare("DELETE FROM overlays WHERE id = ?").run(id);
    return res.changes > 0;
  },

  get(id: number): Overlay | undefined {
    const row = db.prepare("SELECT * FROM overlays WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    return row ? rowToOverlay(row) : undefined;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Content blocks — flat key/JSON store for page sections
// ─────────────────────────────────────────────────────────────────────────────

export const contentQueries = {
  get(key: string): ContentRow | undefined {
    const row = db
      .prepare("SELECT key, value, updated_at FROM content WHERE key = ?")
      .get(key) as { key: string; value: string; updated_at: number } | undefined;
    if (!row) return undefined;
    return { key: row.key, value: row.value, updatedAt: row.updated_at };
  },

  upsert(key: string, value: string): ContentRow {
    const now = Date.now();
    db.prepare(
      `INSERT INTO content (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    ).run(key, value, now);
    return { key, value, updatedAt: now };
  },

  all(): ContentRow[] {
    const rows = db
      .prepare("SELECT key, value, updated_at FROM content ORDER BY key ASC")
      .all() as { key: string; value: string; updated_at: number }[];
    return rows.map((r) => ({ key: r.key, value: r.value, updatedAt: r.updated_at }));
  },

  remove(key: string): boolean {
    const res = db.prepare("DELETE FROM content WHERE key = ?").run(key);
    return res.changes > 0;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Special formats — repeating cards on About page
// ─────────────────────────────────────────────────────────────────────────────

const rowToFormat = (r: Record<string, unknown>): SpecialFormat => ({
  id: r.id as number,
  tag: r.tag as string,
  title: r.title as string,
  body: r.body as string,
  image: r.image as string,
  detailsUrl: r.details_url as string,
  sortOrder: r.sort_order as number,
  createdAt: r.created_at as number,
  updatedAt: r.updated_at as number,
});

export const specialFormatQueries = {
  list(): SpecialFormat[] {
    const rows = db
      .prepare("SELECT * FROM special_formats ORDER BY sort_order ASC, id ASC")
      .all() as Record<string, unknown>[];
    return rows.map(rowToFormat);
  },

  insert(f: Omit<SpecialFormat, "id" | "createdAt" | "updatedAt">): SpecialFormat {
    const now = Date.now();
    const res = db
      .prepare(
        `INSERT INTO special_formats (tag, title, body, image, details_url, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(f.tag, f.title, f.body, f.image, f.detailsUrl, f.sortOrder, now, now);
    return this.get(Number(res.lastInsertRowid))!;
  },

  update(
    id: number,
    patch: Partial<Omit<SpecialFormat, "id" | "createdAt" | "updatedAt">>,
  ): SpecialFormat | undefined {
    const existing = this.get(id);
    if (!existing) return undefined;
    const next = { ...existing, ...patch, updatedAt: Date.now() };
    db.prepare(
      `UPDATE special_formats
       SET tag = ?, title = ?, body = ?, image = ?, details_url = ?, sort_order = ?, updated_at = ?
       WHERE id = ?`,
    ).run(next.tag, next.title, next.body, next.image, next.detailsUrl, next.sortOrder, next.updatedAt, id);
    return this.get(id);
  },

  remove(id: number): boolean {
    const res = db.prepare("DELETE FROM special_formats WHERE id = ?").run(id);
    return res.changes > 0;
  },

  get(id: number): SpecialFormat | undefined {
    const row = db.prepare("SELECT * FROM special_formats WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    return row ? rowToFormat(row) : undefined;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Construction gallery — one entry per month
// ─────────────────────────────────────────────────────────────────────────────

const rowToEntry = (r: Record<string, unknown>): ConstructionEntry => ({
  id: r.id as number,
  year: r.year as number,
  month: r.month as number,
  title: r.title as string,
  body: r.body as string,
  bullets: r.bullets as string,
  photos: r.photos as string,
  videoUrl: r.video_url as string,
  sortOrder: r.sort_order as number,
  createdAt: r.created_at as number,
  updatedAt: r.updated_at as number,
});

export const constructionQueries = {
  list(): ConstructionEntry[] {
    const rows = db
      .prepare(
        "SELECT * FROM construction_entries ORDER BY year DESC, month DESC, sort_order ASC, id ASC",
      )
      .all() as Record<string, unknown>[];
    return rows.map(rowToEntry);
  },

  insert(
    e: Omit<ConstructionEntry, "id" | "createdAt" | "updatedAt">,
  ): ConstructionEntry {
    const now = Date.now();
    const res = db
      .prepare(
        `INSERT INTO construction_entries
         (year, month, title, body, bullets, photos, video_url, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        e.year,
        e.month,
        e.title,
        e.body,
        e.bullets,
        e.photos,
        e.videoUrl,
        e.sortOrder,
        now,
        now,
      );
    return this.get(Number(res.lastInsertRowid))!;
  },

  update(
    id: number,
    patch: Partial<Omit<ConstructionEntry, "id" | "createdAt" | "updatedAt">>,
  ): ConstructionEntry | undefined {
    const existing = this.get(id);
    if (!existing) return undefined;
    const next = { ...existing, ...patch, updatedAt: Date.now() };
    db.prepare(
      `UPDATE construction_entries
       SET year = ?, month = ?, title = ?, body = ?, bullets = ?, photos = ?,
           video_url = ?, sort_order = ?, updated_at = ?
       WHERE id = ?`,
    ).run(
      next.year,
      next.month,
      next.title,
      next.body,
      next.bullets,
      next.photos,
      next.videoUrl,
      next.sortOrder,
      next.updatedAt,
      id,
    );
    return this.get(id);
  },

  remove(id: number): boolean {
    const res = db.prepare("DELETE FROM construction_entries WHERE id = ?").run(id);
    return res.changes > 0;
  },

  get(id: number): ConstructionEntry | undefined {
    const row = db
      .prepare("SELECT * FROM construction_entries WHERE id = ?")
      .get(id) as Record<string, unknown> | undefined;
    return row ? rowToEntry(row) : undefined;
  },
};
