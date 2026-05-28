import { useEffect, useState } from "react";
import {
  NumberField,
  PhotoListField,
  StringListField,
  TextAreaField,
  TextField,
  UrlField,
} from "@/components/admin/CmsField";
import {
  Loading,
  SectionHeader,
} from "@/screens/admin/SiteHeaderSection";
import { constructionApi, type ConstructionEntry } from "@/lib/cms";

type Draft = Omit<ConstructionEntry, "id" | "createdAt" | "updatedAt">;

const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

function blankDraft(): Draft {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    title: "",
    body: "",
    bullets: [],
    photos: [],
    videoUrl: "",
    sortOrder: 0,
  };
}

export function AboutConstructionGallerySection() {
  const [items, setItems] = useState<ConstructionEntry[] | null>(null);
  const [editing, setEditing] = useState<{ id: number | null; draft: Draft } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const list = await constructionApi.list();
      setItems(list);
    } catch (e) {
      setError(`Не удалось загрузить: ${e}`);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const openNew = () => setEditing({ id: null, draft: blankDraft() });

  const openEdit = (item: ConstructionEntry) =>
    setEditing({
      id: item.id,
      draft: {
        year: item.year,
        month: item.month,
        title: item.title,
        body: item.body,
        bullets: item.bullets,
        photos: item.photos,
        videoUrl: item.videoUrl,
        sortOrder: item.sortOrder,
      },
    });

  const submit = async () => {
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      if (editing.id == null) {
        await constructionApi.create(editing.draft);
      } else {
        await constructionApi.update(editing.id, editing.draft);
      }
      await refresh();
      setEditing(null);
    } catch (e) {
      setError(`Не удалось сохранить: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Удалить эту запись?")) return;
    setBusy(true);
    setError(null);
    try {
      await constructionApi.remove(id);
      await refresh();
    } catch (e) {
      setError(`Не удалось удалить: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  if (items == null) return <Loading />;

  return (
    <div className="flex h-screen flex-col">
      <SectionHeader
        title="Динамика строительства — галерея"
        subtitle="Архив прогресса по месяцам. Открывается с кнопки «Смотреть галерею» в текущей динамике."
      />

      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 border border-red-300 bg-red-50 px-4 py-3 font-sans text-small text-red-700">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <p className="font-sans text-body text-base-600">
            Пока нет записей. Добавьте первую: «{MONTHS[new Date().getMonth()]} {new Date().getFullYear()}».
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex flex-col border border-base-200 bg-base-0"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-base-100">
                  {item.photos[0] ? (
                    <img
                      src={item.photos[0]}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center font-sans text-small text-base-500">
                      Нет фото
                    </div>
                  )}
                  <span className="absolute left-3 top-3 bg-base-0/90 px-2.5 py-1 font-sans text-[12px] font-medium uppercase">
                    {MONTHS[item.month - 1]} {item.year}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h4 className="font-display text-h5 font-semibold">
                    {item.title || <em className="text-base-500">без названия</em>}
                  </h4>
                  <p className="line-clamp-2 font-sans text-small text-base-600">
                    {item.body}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-3 font-sans text-[11px] text-base-500">
                    <span>{item.photos.length} фото</span>
                    {item.videoUrl && <span>· видео</span>}
                  </div>
                  <div className="mt-auto flex gap-2 pt-3">
                    <button
                      onClick={() => openEdit(item)}
                      className="h-9 flex-1 border border-base-800 bg-base-0 px-3 font-sans text-small font-medium text-base-800 hover:bg-base-100"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => remove(item.id)}
                      disabled={busy}
                      className="h-9 border border-red-300 bg-base-0 px-3 font-sans text-small font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <button
          onClick={openNew}
          className="mt-6 h-12 border border-dashed border-base-400 bg-base-0 px-6 font-sans text-body font-medium text-base-800 hover:bg-base-100"
        >
          + Добавить месяц
        </button>
      </div>

      {editing && (
        <EditorModal
          draft={editing.draft}
          onChange={(d) => setEditing({ ...editing, draft: d })}
          onCancel={() => setEditing(null)}
          onSubmit={submit}
          busy={busy}
          isNew={editing.id == null}
        />
      )}
    </div>
  );
}

function EditorModal({
  draft,
  onChange,
  onCancel,
  onSubmit,
  busy,
  isNew,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
  onCancel: () => void;
  onSubmit: () => void;
  busy: boolean;
  isNew: boolean;
}) {
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-6">
      <div className="flex max-h-[90vh] w-full max-w-[820px] flex-col bg-base-0 shadow-card">
        <header className="border-b border-base-200 px-6 py-4">
          <h3 className="font-display text-h4 font-semibold">
            {isNew ? "Новый месяц" : "Редактирование месяца"}
          </h3>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block font-sans text-upper uppercase tracking-wide text-base-600">
                Месяц
              </span>
              <select
                value={draft.month}
                onChange={(e) => set({ month: Number(e.target.value) })}
                className="h-11 w-full border border-base-200 bg-base-0 px-3 outline-none"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <NumberField
              label="Год"
              value={draft.year}
              onChange={(v) => set({ year: v })}
              min={2020}
              max={2099}
            />
          </div>

          <TextField
            label="Заголовок"
            value={draft.title}
            onChange={(v) => set({ title: v })}
            placeholder="Этап монолитных работ"
          />
          <TextAreaField
            label="Описание"
            value={draft.body}
            onChange={(v) => set({ body: v })}
            rows={4}
          />
          <StringListField
            label="Список выполненных работ"
            value={draft.bullets}
            onChange={(v) => set({ bullets: v })}
            placeholder="Монолитные работы: …"
          />

          <PhotoListField
            label="Фото"
            value={draft.photos}
            onChange={(v) => set({ photos: v })}
            recommended="1200×800 (3:2)"
          />

          <UrlField
            label="Ссылка на видео (YouTube / VK / Kinescope)"
            value={draft.videoUrl}
            onChange={(v) => set({ videoUrl: v })}
            placeholder="https://www.youtube.com/watch?v=…"
            hint="Можно оставить пустым"
          />

          <NumberField
            label="Порядок"
            value={draft.sortOrder}
            onChange={(v) => set({ sortOrder: v })}
            hint="Меньше = раньше в галерее (внутри одного месяца)"
          />
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-base-200 px-6 py-4">
          <button
            onClick={onCancel}
            className="h-11 border border-base-200 bg-base-0 px-5 font-sans text-body font-medium"
          >
            Отмена
          </button>
          <button
            onClick={onSubmit}
            disabled={busy}
            className="h-11 bg-accent px-6 font-sans text-body font-medium text-base-0 disabled:opacity-50"
          >
            {busy ? "Сохранение…" : "Сохранить"}
          </button>
        </footer>
      </div>
    </div>
  );
}
