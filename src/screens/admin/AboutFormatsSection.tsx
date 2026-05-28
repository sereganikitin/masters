import { useEffect, useState } from "react";
import {
  ImageField,
  TextAreaField,
  TextField,
  UrlField,
} from "@/components/admin/CmsField";
import {
  Loading,
  SectionHeader,
} from "@/screens/admin/SiteHeaderSection";
import { specialFormatsApi, type SpecialFormat } from "@/lib/cms";

type Draft = Omit<SpecialFormat, "id" | "createdAt" | "updatedAt">;

const EMPTY: Draft = {
  tag: "",
  title: "",
  body: "",
  image: "",
  detailsUrl: "",
  sortOrder: Date.now(),
};

export function AboutFormatsSection() {
  const [items, setItems] = useState<SpecialFormat[] | null>(null);
  const [editing, setEditing] = useState<{ id: number | null; draft: Draft } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const list = await specialFormatsApi.list();
      setItems(list);
    } catch (e) {
      setError(`Не удалось загрузить: ${e}`);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const openNew = () => setEditing({ id: null, draft: { ...EMPTY, sortOrder: Date.now() } });

  const openEdit = (item: SpecialFormat) =>
    setEditing({
      id: item.id,
      draft: {
        tag: item.tag,
        title: item.title,
        body: item.body,
        image: item.image,
        detailsUrl: item.detailsUrl,
        sortOrder: item.sortOrder,
      },
    });

  const closeEditor = () => setEditing(null);

  const submit = async () => {
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      if (editing.id == null) {
        await specialFormatsApi.create(editing.draft);
      } else {
        await specialFormatsApi.update(editing.id, editing.draft);
      }
      await refresh();
      closeEditor();
    } catch (e) {
      setError(`Не удалось сохранить: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Удалить этот формат?")) return;
    setBusy(true);
    setError(null);
    try {
      await specialFormatsApi.remove(id);
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
        title="Особые форматы"
        subtitle="Список карточек, рендерится в порядке «sort order». Кнопка «Показать ещё 3» открывает скрытые."
      />

      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 border border-red-300 bg-red-50 px-4 py-3 font-sans text-small text-red-700">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <p className="font-sans text-body text-base-600">Пока ничего не добавлено.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item, idx) => (
              <article
                key={item.id}
                className="grid grid-cols-[100px_120px_1fr_auto] items-center gap-4 border border-base-200 bg-base-0 p-4"
              >
                <span className="font-display text-h5 text-base-500">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="relative h-[80px] w-full overflow-hidden bg-base-100">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center font-sans text-[11px] text-base-500">
                      Нет фото
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-display text-h5 font-semibold text-base-800">
                    {item.title || <em className="text-base-500">без названия</em>}
                  </h4>
                  <p className="mt-1 line-clamp-2 font-sans text-small text-base-600">
                    {item.body}
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-col gap-1">
                  <button
                    onClick={() => openEdit(item)}
                    className="h-9 border border-base-800 bg-base-0 px-4 font-sans text-small font-medium text-base-800 hover:bg-base-100"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    disabled={busy}
                    className="h-9 border border-red-300 bg-base-0 px-4 font-sans text-small font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Удалить
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <button
          onClick={openNew}
          className="mt-6 h-12 border border-dashed border-base-400 bg-base-0 px-6 font-sans text-body font-medium text-base-800 hover:bg-base-100"
        >
          + Добавить формат
        </button>
      </div>

      {editing && (
        <EditorModal
          draft={editing.draft}
          onChange={(d) => setEditing({ ...editing, draft: d })}
          onCancel={closeEditor}
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
      <div className="flex max-h-[90vh] w-full max-w-[760px] flex-col bg-base-0 shadow-card">
        <header className="border-b border-base-200 px-6 py-4">
          <h3 className="font-display text-h4 font-semibold">
            {isNew ? "Новый формат" : "Редактирование формата"}
          </h3>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div className="grid grid-cols-[120px_1fr] gap-4">
            <TextField
              label="Номер"
              value={draft.tag}
              onChange={(v) => set({ tag: v })}
              placeholder="01"
              hint="Например 01, 02, 03"
            />
            <TextField
              label="Название"
              value={draft.title}
              onChange={(v) => set({ title: v })}
              placeholder="Собственные террасы"
            />
          </div>
          <TextAreaField
            label="Описание"
            value={draft.body}
            onChange={(v) => set({ body: v })}
            rows={5}
          />
          <ImageField
            label="Фото"
            value={draft.image}
            onChange={(v) => set({ image: v })}
            recommended="800×600 (4:3)"
          />
          <UrlField
            label="Ссылка «Подробнее»"
            value={draft.detailsUrl}
            onChange={(v) => set({ detailsUrl: v })}
            hint="Оставьте пустым — кнопка не будет навигировать"
          />
          <label className="block">
            <span className="mb-1 block font-sans text-upper uppercase tracking-wide text-base-600">
              Порядок (sortOrder)
            </span>
            <input
              type="number"
              value={draft.sortOrder}
              onChange={(e) => set({ sortOrder: Number(e.target.value) || 0 })}
              className="h-11 w-full border border-base-200 bg-base-0 px-3 outline-none focus:border-accent"
            />
            <span className="mt-1 block font-sans text-[11px] text-base-500">
              Меньше = выше в списке.
            </span>
          </label>
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
