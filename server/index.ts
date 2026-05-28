import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import {
  overlayQueries,
  contentQueries,
  specialFormatQueries,
  constructionQueries,
} from "./db";

const PORT = Number(process.env.PORT ?? 3001);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "dev-token-change-me";

const UPLOAD_DIR = path.resolve(import.meta.dirname, "..", "uploads");
mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Static — uploaded media, served at /uploads/*.
app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "1d" }));

// ─────────────────────────────────────────────────────────────────────────────
// Auth middleware
// ─────────────────────────────────────────────────────────────────────────────

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ─────────────────────────────────────────────────────────────────────────────
// Health + auth check
// ─────────────────────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: Date.now() });
});

app.post("/api/auth/check", (req, res) => {
  const { token } = req.body as { token?: string };
  res.json({ ok: token === ADMIN_TOKEN });
});

// ─────────────────────────────────────────────────────────────────────────────
// Overlays — public read, protected write
// ─────────────────────────────────────────────────────────────────────────────

app.get("/api/overlays", (req, res) => {
  const scope = String(req.query.scope ?? "");
  const scopeKey = String(req.query.scopeKey ?? "");
  if (!scope) {
    return res.json(overlayQueries.all());
  }
  res.json(overlayQueries.listByScope(scope, scopeKey));
});

app.post("/api/overlays", requireAuth, (req, res) => {
  const body = req.body as {
    scope?: string;
    scopeKey?: string;
    entityType?: string;
    entityId?: string;
    label?: string;
    points?: [number, number][];
    color?: string;
  };
  if (!body.scope || !body.entityType || !body.entityId || !Array.isArray(body.points)) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const created = overlayQueries.insert({
    scope: body.scope as "genplan" | "section" | "floor",
    scopeKey: body.scopeKey ?? "",
    entityType: body.entityType as "section" | "floor" | "apartment",
    entityId: body.entityId,
    label: body.label ?? "",
    points: JSON.stringify(body.points),
    color: body.color ?? "#0061A6",
  });
  res.status(201).json(created);
});

app.put("/api/overlays/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  if (typeof body.scope === "string") patch.scope = body.scope;
  if (typeof body.scopeKey === "string") patch.scopeKey = body.scopeKey;
  if (typeof body.entityType === "string") patch.entityType = body.entityType;
  if (typeof body.entityId === "string") patch.entityId = body.entityId;
  if (typeof body.label === "string") patch.label = body.label;
  if (typeof body.color === "string") patch.color = body.color;
  if (Array.isArray(body.points)) patch.points = JSON.stringify(body.points);

  const updated = overlayQueries.update(id, patch);
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

app.delete("/api/overlays/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const ok = overlayQueries.remove(id);
  if (!ok) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

// ─────────────────────────────────────────────────────────────────────────────
// Content blocks — public read, protected write
// ─────────────────────────────────────────────────────────────────────────────

app.get("/api/content/:key", (req, res) => {
  const key = String(req.params.key);
  const row = contentQueries.get(key);
  if (!row) return res.json({ key, value: null, updatedAt: null });
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(row.value);
  } catch {
    parsed = null;
  }
  res.json({ key: row.key, value: parsed, updatedAt: row.updatedAt });
});

app.get("/api/content", (_req, res) => {
  const rows = contentQueries.all().map((r) => {
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(r.value);
    } catch {
      parsed = null;
    }
    return { key: r.key, value: parsed, updatedAt: r.updatedAt };
  });
  res.json(rows);
});

app.put("/api/content/:key", requireAuth, (req, res) => {
  const key = String(req.params.key ?? "");
  if (!key || key.length > 128) {
    return res.status(400).json({ error: "Invalid key" });
  }
  const value = (req.body as { value?: unknown }).value;
  if (value === undefined) {
    return res.status(400).json({ error: "Missing value" });
  }
  const serialized = JSON.stringify(value);
  if (serialized.length > 256 * 1024) {
    return res.status(413).json({ error: "Content too large" });
  }
  const row = contentQueries.upsert(key, serialized);
  res.json({ key: row.key, value, updatedAt: row.updatedAt });
});

app.delete("/api/content/:key", requireAuth, (req, res) => {
  const ok = contentQueries.remove(String(req.params.key));
  if (!ok) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

// ─────────────────────────────────────────────────────────────────────────────
// Special formats — list of cards on the About page
// ─────────────────────────────────────────────────────────────────────────────

app.get("/api/special-formats", (_req, res) => {
  res.json(specialFormatQueries.list());
});

app.post("/api/special-formats", requireAuth, (req, res) => {
  const b = req.body as Partial<{
    tag: string;
    title: string;
    body: string;
    image: string;
    detailsUrl: string;
    sortOrder: number;
  }>;
  const created = specialFormatQueries.insert({
    tag: b.tag ?? "",
    title: b.title ?? "",
    body: b.body ?? "",
    image: b.image ?? "",
    detailsUrl: b.detailsUrl ?? "",
    sortOrder: Number.isFinite(b.sortOrder) ? Number(b.sortOrder) : Date.now(),
  });
  res.status(201).json(created);
});

app.put("/api/special-formats/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const b = req.body as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  if (typeof b.tag === "string") patch.tag = b.tag;
  if (typeof b.title === "string") patch.title = b.title;
  if (typeof b.body === "string") patch.body = b.body;
  if (typeof b.image === "string") patch.image = b.image;
  if (typeof b.detailsUrl === "string") patch.detailsUrl = b.detailsUrl;
  if (typeof b.sortOrder === "number") patch.sortOrder = b.sortOrder;
  const updated = specialFormatQueries.update(id, patch);
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

app.delete("/api/special-formats/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const ok = specialFormatQueries.remove(id);
  if (!ok) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

// ─────────────────────────────────────────────────────────────────────────────
// Construction gallery — one entry per month
// ─────────────────────────────────────────────────────────────────────────────

interface ConstructionInput {
  year?: number;
  month?: number;
  title?: string;
  body?: string;
  bullets?: string[];
  photos?: string[];
  videoUrl?: string;
  sortOrder?: number;
}

function parseConstructionRow(r: ReturnType<typeof constructionQueries.list>[number]) {
  let bullets: string[] = [];
  let photos: string[] = [];
  try {
    const b = JSON.parse(r.bullets);
    if (Array.isArray(b)) bullets = b as string[];
  } catch {
    /* ignore */
  }
  try {
    const p = JSON.parse(r.photos);
    if (Array.isArray(p)) photos = p as string[];
  } catch {
    /* ignore */
  }
  return { ...r, bullets, photos };
}

app.get("/api/construction", (_req, res) => {
  res.json(constructionQueries.list().map(parseConstructionRow));
});

app.post("/api/construction", requireAuth, (req, res) => {
  const b = req.body as ConstructionInput;
  if (
    !Number.isFinite(b.year) ||
    !Number.isFinite(b.month) ||
    Number(b.month) < 1 ||
    Number(b.month) > 12
  ) {
    return res.status(400).json({ error: "Year/month required" });
  }
  const created = constructionQueries.insert({
    year: Number(b.year),
    month: Number(b.month),
    title: b.title ?? "",
    body: b.body ?? "",
    bullets: JSON.stringify(Array.isArray(b.bullets) ? b.bullets : []),
    photos: JSON.stringify(Array.isArray(b.photos) ? b.photos : []),
    videoUrl: b.videoUrl ?? "",
    sortOrder: Number.isFinite(b.sortOrder) ? Number(b.sortOrder) : 0,
  });
  res.status(201).json(parseConstructionRow(created));
});

app.put("/api/construction/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const b = req.body as ConstructionInput;
  const patch: Record<string, unknown> = {};
  if (typeof b.year === "number") patch.year = b.year;
  if (typeof b.month === "number") patch.month = b.month;
  if (typeof b.title === "string") patch.title = b.title;
  if (typeof b.body === "string") patch.body = b.body;
  if (Array.isArray(b.bullets)) patch.bullets = JSON.stringify(b.bullets);
  if (Array.isArray(b.photos)) patch.photos = JSON.stringify(b.photos);
  if (typeof b.videoUrl === "string") patch.videoUrl = b.videoUrl;
  if (typeof b.sortOrder === "number") patch.sortOrder = b.sortOrder;
  const updated = constructionQueries.update(id, patch);
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(parseConstructionRow(updated));
});

app.delete("/api/construction/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const ok = constructionQueries.remove(id);
  if (!ok) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

// ─────────────────────────────────────────────────────────────────────────────
// Uploads — multipart image/file upload
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().slice(0, 8) || "";
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

app.post("/api/uploads", requireAuth, (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "Upload failed" });
    }
    const f = req.file;
    if (!f) return res.status(400).json({ error: "No file" });
    res.status(201).json({
      url: `/uploads/${f.filename}`,
      filename: f.filename,
      originalName: f.originalname,
      mimeType: f.mimetype,
      size: f.size,
    });
    next?.();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Admin API listening on http://localhost:${PORT}`);
  console.log(`Uploads served from ${UPLOAD_DIR}`);
  if (ADMIN_TOKEN === "dev-token-change-me") {
    console.warn("WARNING: Using default ADMIN_TOKEN. Set ADMIN_TOKEN env in production.");
  }
});
