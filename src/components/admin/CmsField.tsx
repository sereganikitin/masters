import { useState, useRef } from "react";
import { uploadFile } from "@/lib/cms";

// ─────────────────────────────────────────────────────────────────────────────
// Layout helpers
// ─────────────────────────────────────────────────────────────────────────────

export function FieldLabel({
  label,
  hint,
}: {
  label: string;
  hint?: string;
}) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <span className="font-sans text-upper uppercase tracking-wide text-base-600">
        {label}
      </span>
      {hint && <span className="font-sans text-[11px] text-base-500">{hint}</span>}
    </div>
  );
}

export function FormGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-base-0 p-6 shadow-card">
      <h3 className="font-display text-h5 font-semibold text-base-800">{title}</h3>
      {description && (
        <p className="mt-1 font-sans text-small text-base-600">{description}</p>
      )}
      <div className="mt-6 flex flex-col gap-5">{children}</div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Text inputs
// ─────────────────────────────────────────────────────────────────────────────

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <FieldLabel label={label} hint={hint} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full border border-base-200 bg-base-0 px-3 font-sans text-body outline-none transition-colors focus:border-accent"
      />
    </label>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <FieldLabel label={label} hint={hint} />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="block w-full resize-y border border-base-200 bg-base-0 px-3 py-2 font-sans text-body leading-relaxed outline-none transition-colors focus:border-accent"
      />
    </label>
  );
}

export function UrlField({
  label,
  value,
  onChange,
  placeholder = "https://…",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <FieldLabel label={label} hint={hint ?? "Ссылка (HTTPS)"} />
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full border border-base-200 bg-base-0 px-3 font-sans text-body outline-none transition-colors focus:border-accent"
      />
    </label>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <FieldLabel label={label} hint={hint} />
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        className="h-11 w-full border border-base-200 bg-base-0 px-3 font-sans text-body outline-none transition-colors focus:border-accent"
      />
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Image upload — preview + replace + recommended size hint
// ─────────────────────────────────────────────────────────────────────────────

export function ImageField({
  label,
  value,
  onChange,
  recommended,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Recommended dimensions, e.g. "1200×900 (4:3)". Displayed under the field. */
  recommended?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async (f: File) => {
    setBusy(true);
    setError(null);
    try {
      const result = await uploadFile(f);
      onChange(result.url);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="block">
      <FieldLabel
        label={label}
        hint={recommended ? `Рекомендуем: ${recommended}` : undefined}
      />
      <div className="flex items-stretch gap-4">
        <div className="relative h-[120px] w-[180px] flex-shrink-0 overflow-hidden border border-base-200 bg-base-100">
          {value ? (
            <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center font-sans text-[11px] text-base-500">
              Нет картинки
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 grid place-items-center bg-base-0/80 font-sans text-small font-medium">
              Загрузка…
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
          <div className="min-w-0">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="URL картинки или загрузите файл"
              className="h-10 w-full border border-base-200 bg-base-0 px-3 font-mono text-[12px] outline-none transition-colors focus:border-accent"
            />
            {error && (
              <p className="mt-1 font-sans text-[11px] text-red-600">{error}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="h-9 border border-base-800 bg-base-0 px-4 font-sans text-small font-medium text-base-800 hover:bg-base-100 disabled:opacity-50"
            >
              {value ? "Заменить" : "Загрузить файл"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                disabled={busy}
                className="h-9 border border-base-200 bg-base-0 px-4 font-sans text-small font-medium text-base-600 hover:bg-base-100 disabled:opacity-50"
              >
                Очистить
              </button>
            )}
          </div>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handle(f);
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// String list — dynamic add/remove of text items (bullets, paragraphs, etc.)
// ─────────────────────────────────────────────────────────────────────────────

export function StringListField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  multiline = false,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
}) {
  const update = (idx: number, next: string) =>
    onChange(value.map((v, i) => (i === idx ? next : v)));
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  const add = () => onChange([...value, ""]);

  return (
    <div className="block">
      <FieldLabel label={label} hint={hint} />
      <div className="flex flex-col gap-2">
        {value.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="mt-3 font-sans text-small text-base-500">{idx + 1}.</span>
            {multiline ? (
              <textarea
                value={item}
                onChange={(e) => update(idx, e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="block w-full resize-y border border-base-200 bg-base-0 px-3 py-2 font-sans text-body leading-relaxed outline-none transition-colors focus:border-accent"
              />
            ) : (
              <input
                type="text"
                value={item}
                onChange={(e) => update(idx, e.target.value)}
                placeholder={placeholder}
                className="h-11 w-full border border-base-200 bg-base-0 px-3 font-sans text-body outline-none transition-colors focus:border-accent"
              />
            )}
            <button
              type="button"
              onClick={() => remove(idx)}
              className="mt-1 grid h-9 w-9 flex-shrink-0 place-items-center border border-base-200 bg-base-0 text-base-600 hover:bg-base-100"
              aria-label="Удалить пункт"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="mt-1 h-10 self-start border border-dashed border-base-300 bg-base-0 px-4 font-sans text-small font-medium text-base-700 hover:bg-base-100"
        >
          + Добавить пункт
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Photo list — same as StringListField but with ImageField rows
// ─────────────────────────────────────────────────────────────────────────────

export function PhotoListField({
  label,
  value,
  onChange,
  recommended,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  recommended?: string;
}) {
  const update = (idx: number, next: string) =>
    onChange(value.map((v, i) => (i === idx ? next : v)));
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  const add = () => onChange([...value, ""]);

  return (
    <div className="block">
      <FieldLabel
        label={label}
        hint={recommended ? `Рекомендуем: ${recommended}` : undefined}
      />
      <div className="flex flex-col gap-3">
        {value.map((url, idx) => (
          <div key={idx} className="flex gap-3 border border-base-200 bg-base-100 p-3">
            <div className="flex-1">
              <ImageField
                label={`Фото ${idx + 1}`}
                value={url}
                onChange={(u) => update(idx, u)}
                recommended={recommended}
              />
            </div>
            <button
              type="button"
              onClick={() => remove(idx)}
              className="h-9 self-start border border-base-200 bg-base-0 px-3 font-sans text-small font-medium text-base-600 hover:bg-base-100"
            >
              Удалить
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="h-10 self-start border border-dashed border-base-300 bg-base-0 px-4 font-sans text-small font-medium text-base-700 hover:bg-base-100"
        >
          + Добавить фото
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Save bar — sticky action bar at the bottom of a form
// ─────────────────────────────────────────────────────────────────────────────

export function SaveBar({
  onSave,
  saving,
  saved,
  error,
  dirty,
}: {
  onSave: () => void;
  saving?: boolean;
  saved?: boolean;
  error?: string | null;
  dirty?: boolean;
}) {
  return (
    <div className="sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t border-base-200 bg-base-0 px-6 py-4 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
      <div className="font-sans text-small text-base-600">
        {error && <span className="text-red-600">{error}</span>}
        {!error && saved && !dirty && <span className="text-green-700">Сохранено ✓</span>}
        {!error && dirty && !saving && <span>Есть несохранённые изменения</span>}
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={saving || !dirty}
        className="flex h-11 items-center bg-accent px-6 font-sans text-body font-medium text-base-0 disabled:opacity-50"
      >
        {saving ? "Сохранение…" : "Сохранить"}
      </button>
    </div>
  );
}
