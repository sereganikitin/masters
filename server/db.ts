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
