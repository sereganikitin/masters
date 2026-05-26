import { useEffect, useMemo, useState } from "react";
import { PolygonEditor } from "@/components/admin/PolygonEditor";
import { adminAuth, overlaysApi, type Overlay, type OverlayScope, type OverlayEntity } from "@/lib/overlays";
import { getHouse } from "@/data/complex";
import { floorPlanUrl } from "@/lib/plans";

interface BgOption {
  label: string;
  src: string;
}

const BG_LIBRARY: BgOption[] = [
  { label: "Аэрофото комплекса (для секций)", src: "/images/hero-genplan.png" },
  { label: "Фасад секции (для этажей)", src: "/images/floor-closeup.png" },
  { label: "Hero: О проекте", src: "/images/hero-about.png" },
  { label: "Hero: Выбрать квартиру", src: "/images/hero-choose.png" },
  { label: "3D-тур сцена", src: "/images/tour-scene.png" },
];

function defaultBgForScope(scope: OverlayScope, scopeKey: string): BgOption {
  if (scope === "genplan") return BG_LIBRARY[0];
  if (scope === "section") return BG_LIBRARY[1];
  const m = scopeKey.match(/^(\d+)[_-](\d+)$/);
  if (m) {
    const section = Number(m[1]);
    const floor = Number(m[2]);
    return {
      label: `Поэтажный план: секция ${section}, этаж ${floor}`,
      src: floorPlanUrl(section, floor),
    };
  }
  return { label: "Укажите scopeKey в формате <секция>_<этаж>", src: "" };
}

const COORD_W = 1920;
const COORD_H = 1080;

export function AdminScreen() {
  const [authed, setAuthed] = useState<boolean>(() => Boolean(adminAuth.get()));
  if (!authed) return <Login onAuthed={() => setAuthed(true)} />;
  return <AdminMain />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Login
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

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

interface DraftMeta {
  entityType: OverlayEntity;
  entityId: string;
  label: string;
  color: string;
}

function AdminMain() {
  const [scope, setScope] = useState<OverlayScope>("genplan");
  const [scopeKey, setScopeKey] = useState<string>("");
  const [bgOverride, setBgOverride] = useState<number | null>(null);

  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [draft, setDraft] = useState<[number, number][] | null>(null);
  const [draftMeta, setDraftMeta] = useState<DraftMeta>({
    entityType: "section",
    entityId: "",
    label: "",
    color: "#0061A6",
  });

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await overlaysApi.list(scope, scopeKey);
      setOverlays(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [scope, scopeKey]);

  const startDraft = () => {
    setSelectedId(null);
    setDraft([]);
    setDraftMeta((m) => ({
      ...m,
      entityType: scope === "genplan" ? "section" : scope === "section" ? "floor" : "apartment",
      entityId: "",
      label: "",
    }));
  };

  const finishDraft = async () => {
    if (!draft || draft.length < 3) {
      alert("Нужно минимум 3 точки");
      return;
    }
    if (!draftMeta.entityId) {
      alert("Выберите объект из списка");
      return;
    }
    try {
      const created = await overlaysApi.create({
        scope,
        scopeKey,
        entityType: draftMeta.entityType,
        entityId: draftMeta.entityId,
        label: draftMeta.label,
        color: draftMeta.color,
        points: draft,
      });
      setOverlays((prev) => [...prev, created]);
      setSelectedId(created.id);
      setDraft(null);
    } catch (e) {
      alert(String(e));
    }
  };

  const cancelDraft = () => {
    setDraft(null);
  };

  const removeSelected = async () => {
    if (selectedId == null) return;
    if (!confirm("Удалить обводку?")) return;
    try {
      await overlaysApi.remove(selectedId);
      setOverlays((prev) => prev.filter((o) => o.id !== selectedId));
      setSelectedId(null);
    } catch (e) {
      alert(String(e));
    }
  };

  const moveVertex = async (overlayId: number, vIdx: number, p: [number, number]) => {
    const overlay = overlays.find((o) => o.id === overlayId);
    if (!overlay) return;
    const nextPoints = overlay.points.map((pt, i) => (i === vIdx ? p : pt)) as [number, number][];
    setOverlays((prev) => prev.map((o) => (o.id === overlayId ? { ...o, points: nextPoints } : o)));
    try {
      await overlaysApi.update(overlayId, { points: nextPoints });
    } catch (e) {
      console.error(e);
    }
  };

  const editorOverlays = useMemo(
    () =>
      overlays.map((o) => ({
        id: o.id,
        points: o.points,
        color: o.color,
        label: o.label,
        selected: selectedId === o.id,
      })),
    [overlays, selectedId],
  );

  const bg = useMemo<BgOption>(() => {
    if (bgOverride !== null) return BG_LIBRARY[bgOverride];
    return defaultBgForScope(scope, scopeKey);
  }, [bgOverride, scope, scopeKey]);

  return (
    <div className="min-h-screen bg-base-100 text-base-800">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-base-200 bg-base-0 px-8 py-5">
        <div>
          <p className="font-sans text-upper uppercase tracking-[0.3em] text-base-600">
            ЖК МАСТЕРС · Админ-панель
          </p>
          <h1 className="font-display text-h4 font-semibold">Редактор обводок</h1>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="h-10 border border-base-200 bg-base-0 px-4 py-2.5 font-sans text-small font-medium"
          >
            На сайт
          </a>
          <button
            onClick={() => {
              adminAuth.clear();
              location.reload();
            }}
            className="h-10 border border-base-200 bg-base-0 px-4 font-sans text-small font-medium"
          >
            Выйти
          </button>
        </div>
      </header>

      <div className="grid grid-cols-[300px_1fr_300px] gap-5 p-5">
        {/* Left: scope + bg + draw controls */}
        <aside className="flex flex-col gap-4 self-start bg-base-0 p-5">
          <Field label="Экран (scope)">
            <select
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as OverlayScope);
                setScopeKey("");
                setSelectedId(null);
                setDraft(null);
              }}
              className="h-11 w-full border border-base-200 bg-base-0 px-3 outline-none"
            >
              <option value="genplan">Генплан (секции)</option>
              <option value="section">Секция (этажи)</option>
              <option value="floor">Этаж (квартиры)</option>
            </select>
          </Field>

          {scope === "section" && (
            <Field label="Номер секции">
              <SectionPicker value={scopeKey} onChange={setScopeKey} />
            </Field>
          )}

          {scope === "floor" && <FloorScopePicker scopeKey={scopeKey} onChange={setScopeKey} />}

          <Field
            label={bgOverride === null ? "Фон (автоматически по scope)" : "Фон (вручную)"}
          >
            <select
              value={bgOverride === null ? "" : bgOverride}
              onChange={(e) => {
                const v = e.target.value;
                setBgOverride(v === "" ? null : Number(v));
              }}
              className="h-11 w-full border border-base-200 bg-base-0 px-3 outline-none"
            >
              <option value="">— Авто: {bg.label}</option>
              {BG_LIBRARY.map((b, i) => (
                <option key={b.src} value={i}>
                  {b.label}
                </option>
              ))}
            </select>
          </Field>

          <hr className="border-base-200" />

          {!draft && (
            <button
              onClick={startDraft}
              className="h-12 bg-accent font-sans text-body font-medium text-base-0"
            >
              + Новая обводка
            </button>
          )}

          {draft && (
            <>
              <p className="font-sans text-small text-base-600">
                Кликайте по холсту, чтобы добавить точки. Двойной клик / Enter — закончить.
                Esc — отмена. Минимум 3 точки.
              </p>

              <Field label="Объект">
                <EntityPicker
                  scope={scope}
                  scopeKey={scopeKey}
                  entityType={draftMeta.entityType}
                  value={draftMeta.entityId}
                  onChange={(id, label) =>
                    setDraftMeta((m) => ({
                      ...m,
                      entityId: id,
                      // Suggest label only if user hasn't typed one yet
                      label: m.label || label,
                    }))
                  }
                />
              </Field>

              <Field label="Подпись (опционально)">
                <input
                  type="text"
                  value={draftMeta.label}
                  onChange={(e) => setDraftMeta({ ...draftMeta, label: e.target.value })}
                  placeholder="Автогенерируется по объекту"
                  className="h-11 w-full border border-base-200 bg-base-0 px-3 outline-none"
                />
              </Field>

              <Field label="Цвет подсветки">
                <input
                  type="color"
                  value={draftMeta.color}
                  onChange={(e) => setDraftMeta({ ...draftMeta, color: e.target.value })}
                  className="h-11 w-full border border-base-200 bg-base-0 px-2"
                />
              </Field>

              <div className="flex gap-2">
                <button
                  onClick={finishDraft}
                  className="h-11 flex-1 bg-accent font-sans text-body font-medium text-base-0"
                >
                  Сохранить
                </button>
                <button
                  onClick={cancelDraft}
                  className="h-11 flex-1 border border-base-200 bg-base-0 font-sans text-body font-medium"
                >
                  Отмена
                </button>
              </div>
            </>
          )}
        </aside>

        {/* Editor */}
        <main className="flex flex-col gap-3">
          <div className="text-sm text-base-600">
            Координаты: <code>0 0 {COORD_W} {COORD_H}</code> (равны сцене сайта). Фон:{" "}
            <strong>{bg.label}</strong>.
          </div>
          <PolygonEditor
            coordW={COORD_W}
            coordH={COORD_H}
            imageSrc={bg.src || undefined}
            overlays={editorOverlays}
            draftColor={draftMeta.color}
            draftPoints={draft}
            onAddPoint={(p) => setDraft((prev) => (prev ? [...prev, p] : [p]))}
            onFinishDraft={finishDraft}
            onCancelDraft={cancelDraft}
            onSelectOverlay={setSelectedId}
            onMoveVertex={moveVertex}
            selectedOverlayId={selectedId}
          />
        </main>

        {/* Right: list */}
        <aside className="flex flex-col gap-3 self-start bg-base-0 p-5">
          <h2 className="font-display text-h5 font-semibold">Обводки</h2>
          {loading ? (
            <p className="font-sans text-small text-base-600">Загрузка…</p>
          ) : overlays.length === 0 ? (
            <p className="font-sans text-small text-base-600">
              Нет обводок для текущего экрана.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {overlays.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSelectedId(o.id)}
                  className={`flex items-center gap-3 border px-3 py-2 text-left transition-colors ${
                    selectedId === o.id ? "border-accent bg-base-100" : "border-base-200"
                  }`}
                >
                  <span className="h-4 w-4 flex-shrink-0" style={{ background: o.color }} />
                  <div className="flex-1">
                    <div className="font-sans text-body font-medium">
                      {o.entityType} #{o.entityId}
                    </div>
                    {o.label && (
                      <div className="font-sans text-small text-base-600">{o.label}</div>
                    )}
                    <div className="font-sans text-[11px] text-base-600">
                      {o.points.length} точек · id={o.id}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {selectedId != null && (
            <button
              onClick={removeSelected}
              className="mt-2 h-11 border border-red-300 bg-base-0 font-sans text-small font-medium text-red-600"
            >
              Удалить выбранную
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pickers
// ─────────────────────────────────────────────────────────────────────────────

function SectionPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const house = getHouse();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full border border-base-200 bg-base-0 px-3 outline-none"
    >
      <option value="">— выбрать —</option>
      {house.sections.map((s) => (
        <option key={s.id} value={String(s.number)}>
          Секция {s.number} ({s.apartmentCount} кв.)
        </option>
      ))}
    </select>
  );
}

function FloorScopePicker({
  scopeKey,
  onChange,
}: {
  scopeKey: string;
  onChange: (v: string) => void;
}) {
  const house = getHouse();
  const match = scopeKey.match(/^(\d+)[_-](\d+)$/);
  const currSection = match ? Number(match[1]) : null;
  const currFloor = match ? Number(match[2]) : null;
  const section = currSection ? house.sections.find((s) => s.number === currSection) : null;
  const floors = section
    ? Object.keys(section.apartmentsByFloor).map(Number).sort((a, b) => a - b)
    : [];

  return (
    <>
      <Field label="Секция">
        <select
          value={currSection ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return onChange("");
            onChange(`${v}_${currFloor ?? ""}`.replace(/_$/, ""));
          }}
          className="h-11 w-full border border-base-200 bg-base-0 px-3 outline-none"
        >
          <option value="">— выбрать —</option>
          {house.sections.map((s) => (
            <option key={s.id} value={String(s.number)}>
              Секция {s.number}
            </option>
          ))}
        </select>
      </Field>
      {currSection && (
        <Field label="Этаж">
          <select
            value={currFloor ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              onChange(`${currSection}_${v}`);
            }}
            className="h-11 w-full border border-base-200 bg-base-0 px-3 outline-none"
          >
            <option value="">— выбрать —</option>
            {floors.map((f) => (
              <option key={f} value={String(f)}>
                Этаж {f} ({section!.apartmentsByFloor[f].length} кв.)
              </option>
            ))}
          </select>
        </Field>
      )}
    </>
  );
}

function EntityPicker({
  scope,
  scopeKey,
  entityType,
  value,
  onChange,
}: {
  scope: OverlayScope;
  scopeKey: string;
  entityType: OverlayEntity;
  value: string;
  onChange: (id: string, suggestedLabel: string) => void;
}) {
  const house = getHouse();

  if (entityType === "section") {
    return (
      <select
        value={value}
        onChange={(e) => {
          const id = e.target.value;
          const s = house.sections.find((s) => String(s.number) === id);
          onChange(id, s ? `${s.number} секция · ${s.apartmentCount} кв.` : "");
        }}
        className="h-11 w-full border border-base-200 bg-base-0 px-3 outline-none"
      >
        <option value="">— выбрать секцию —</option>
        {house.sections.map((s) => (
          <option key={s.id} value={String(s.number)}>
            Секция {s.number} ({s.apartmentCount} кв.)
          </option>
        ))}
      </select>
    );
  }

  if (entityType === "floor") {
    // scope=section, scopeKey=<sectionNumber>
    const sectionNum = scope === "section" ? Number(scopeKey) : NaN;
    const section = house.sections.find((s) => s.number === sectionNum);
    if (!section) {
      return (
        <p className="font-sans text-small text-base-600">
          Сначала выберите номер секции в верхнем списке.
        </p>
      );
    }
    const floors = Object.keys(section.apartmentsByFloor).map(Number).sort((a, b) => a - b);
    return (
      <select
        value={value}
        onChange={(e) => {
          const f = e.target.value;
          onChange(`${section.number}_${f}`, `${f} этаж`);
        }}
        className="h-11 w-full border border-base-200 bg-base-0 px-3 outline-none"
      >
        <option value="">— выбрать этаж —</option>
        {floors.map((f) => (
          <option key={f} value={String(f)}>
            Этаж {f} ({section.apartmentsByFloor[f].length} кв.)
          </option>
        ))}
      </select>
    );
  }

  if (entityType === "apartment") {
    // scope=floor, scopeKey=<section>_<floor>
    const match = scopeKey.match(/^(\d+)[_-](\d+)$/);
    if (!match) {
      return (
        <p className="font-sans text-small text-base-600">
          Выберите секцию и этаж сверху, тогда появятся квартиры.
        </p>
      );
    }
    const section = house.sections.find((s) => s.number === Number(match[1]));
    const floor = Number(match[2]);
    const apts = section?.apartmentsByFloor[floor] ?? [];
    return (
      <select
        value={value}
        onChange={(e) => {
          const id = e.target.value;
          const apt = apts.find((a) => a.id === id);
          onChange(
            id,
            apt ? `№${apt.number} · ${apt.area.toFixed(1).replace(".", ",")} м²` : "",
          );
        }}
        className="h-11 w-full border border-base-200 bg-base-0 px-3 outline-none"
      >
        <option value="">— выбрать квартиру —</option>
        {apts.map((a) => (
          <option key={a.id} value={a.id}>
            №{a.number} · {a.area.toFixed(1).replace(".", ",")} м² · {a.rooms}-к
          </option>
        ))}
      </select>
    );
  }

  return null;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-upper uppercase tracking-wide text-base-600">
        {label}
      </span>
      {children}
    </label>
  );
}
