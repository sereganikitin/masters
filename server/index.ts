import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { overlayQueries } from "./db";

const PORT = Number(process.env.PORT ?? 3001);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "dev-token-change-me";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

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

app.listen(PORT, () => {
  console.log(`Admin API listening on http://localhost:${PORT}`);
  if (ADMIN_TOKEN === "dev-token-change-me") {
    console.warn("WARNING: Using default ADMIN_TOKEN. Set ADMIN_TOKEN env in production.");
  }
});
