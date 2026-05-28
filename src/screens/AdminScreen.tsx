import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { adminAuth } from "@/lib/overlays";
import { AdminShell } from "@/screens/admin/AdminShell";
import { OverlaysSection } from "@/screens/admin/OverlaysSection";
import { SiteHeaderSection } from "@/screens/admin/SiteHeaderSection";
import { AboutHeroSection } from "@/screens/admin/AboutHeroSection";
import { AboutTourSection } from "@/screens/admin/AboutTourSection";
import { AboutFormatsSection } from "@/screens/admin/AboutFormatsSection";
import { AboutEngineeringSection } from "@/screens/admin/AboutEngineeringSection";
import { AboutConstructionSection } from "@/screens/admin/AboutConstructionSection";
import { AboutConstructionGallerySection } from "@/screens/admin/AboutConstructionGallerySection";
import { AboutOfficeSection } from "@/screens/admin/AboutOfficeSection";
import { AboutDocumentsSection } from "@/screens/admin/AboutDocumentsSection";

export function AdminScreen() {
  const [authed, setAuthed] = useState<boolean>(() => Boolean(adminAuth.get()));
  if (!authed) return <Login onAuthed={() => setAuthed(true)} />;
  return (
    <Routes>
      <Route element={<AdminShell />}>
        <Route index element={<Navigate to="overlays" replace />} />
        <Route path="overlays" element={<OverlaysSection />} />
        <Route path="site/header" element={<SiteHeaderSection />} />
        <Route path="about/hero" element={<AboutHeroSection />} />
        <Route path="about/tour" element={<AboutTourSection />} />
        <Route path="about/formats" element={<AboutFormatsSection />} />
        <Route path="about/engineering" element={<AboutEngineeringSection />} />
        <Route path="about/construction" element={<AboutConstructionSection />} />
        <Route
          path="about/construction/gallery"
          element={<AboutConstructionGallerySection />}
        />
        <Route path="about/office" element={<AboutOfficeSection />} />
        <Route path="about/documents" element={<AboutDocumentsSection />} />
        <Route path="*" element={<Navigate to="overlays" replace />} />
      </Route>
    </Routes>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Login — auth gate (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function Login({ onAuthed }: { onAuthed: () => void }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const ok = await adminAuth.check(token);
      if (!ok) {
        setError("Неверный токен");
        return;
      }
      adminAuth.set(token);
      onAuthed();
    } catch (e) {
      const msg = String(e);
      if (
        msg.includes("AUTH_HTTP_5") ||
        msg.includes("AUTH_HTTP_502") ||
        msg.includes("AUTH_HTTP_504") ||
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError")
      ) {
        setError(
          "Сервер админки не отвечает. Запусти его в отдельном терминале: npm run server",
        );
      } else if (msg.includes("AUTH_HTTP_404")) {
        setError(
          "Endpoint /api/auth/check не найден. Проверь vite.config (proxy /api → :3001) и перезапусти dev-сервер.",
        );
      } else {
        setError(`Ошибка: ${msg}`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-base-100 px-6">
      <div className="w-full max-w-[420px] bg-base-0 p-10 shadow-card">
        <p className="font-sans text-upper uppercase tracking-[0.3em] text-base-600">
          Админ-панель
        </p>
        <h1 className="mt-3 font-display text-h3 font-semibold text-base-800">Войти</h1>
        <p className="mt-2 font-sans text-small text-base-600">
          Токен задаётся через env <code className="rounded bg-base-100 px-1">ADMIN_TOKEN</code> на сервере.
        </p>
        <input
          type="password"
          autoFocus
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Bearer token"
          className="mt-6 h-12 w-full border border-base-200 px-4 font-sans text-body outline-none focus:border-accent"
        />
        {error && <p className="mt-3 font-sans text-small text-red-600">{error}</p>}
        <button
          onClick={submit}
          disabled={busy || !token}
          className="mt-6 h-12 w-full bg-accent font-sans text-body font-medium text-base-0 disabled:opacity-50"
        >
          {busy ? "Проверка…" : "Войти"}
        </button>
      </div>
    </div>
  );
}
