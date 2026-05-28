import { useCmsSection } from "@/lib/useCmsSection";
import {
  FormGroup,
  ImageField,
  SaveBar,
  TextAreaField,
  TextField,
  UrlField,
} from "@/components/admin/CmsField";
import { Loading, SectionHeader } from "@/screens/admin/SiteHeaderSection";

export interface MetaRow {
  label: string;
  value: string;
  dim?: boolean;
}

export interface CtaTile {
  title: string;
  sub: string;
  url: string;
  icon: "play" | "arrow";
}

export interface AboutHeroContent {
  title: string;
  metaRows: MetaRow[];
  photo: string;
  ctaTiles: CtaTile[];
}

const DEFAULTS: AboutHeroContent = {
  title: "Премиальный\nдом МАСТЕРС",
  metaRows: [
    { label: "Класс жилья", value: "Премиум" },
    { label: "Срок сдачи", value: "IV кв. 2029 г.", dim: true },
    { label: "Адрес", value: "г. Москва, ул. Викторенко, 16" },
    {
      label: "О проекте",
      value:
        "МАСТЕРС у метро Аэропорт — ансамбль разновысотных секций от 8 до 25 этажей. Приватный двор и линейный парк с амфитеатром. Клубная гостиная с камином и коворкинг только для резидентов.",
    },
  ],
  photo: "/images/hero-genplan.png",
  ctaTiles: [
    { title: "Видео о проекте", sub: "Узнайте больше", url: "", icon: "play" },
    { title: "Сайт проекта", sub: "Перейти на сайт", url: "", icon: "arrow" },
  ],
};

export function AboutHeroSection() {
  const { draft, update, save, saving, savedAt, dirty, error, loaded } =
    useCmsSection<AboutHeroContent>("about.hero", DEFAULTS);

  if (!loaded) return <Loading />;

  return (
    <div className="flex h-screen flex-col">
      <SectionHeader
        title="Hero / О проекте"
        subtitle="Первый экран: крупный заголовок, метаданные и фото."
      />

      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        <FormGroup title="Заголовок">
          <TextAreaField
            label="Заголовок (можно с переносом)"
            value={draft.title}
            onChange={(v) => update({ title: v })}
            placeholder={"Премиальный\nдом МАСТЕРС"}
            rows={2}
            hint="Переход на новую строку = новая строка в заголовке"
          />
        </FormGroup>

        <FormGroup title="Метаданные" description="Список строк под заголовком.">
          <MetaRowsEditor
            value={draft.metaRows}
            onChange={(v) => update({ metaRows: v })}
          />
        </FormGroup>

        <FormGroup title="Главное фото">
          <ImageField
            label="Фото справа"
            value={draft.photo}
            onChange={(v) => update({ photo: v })}
            recommended="1200×900 (4:3)"
          />
        </FormGroup>

        <FormGroup title="Плитки под фото">
          <CtaTilesEditor
            value={draft.ctaTiles}
            onChange={(v) => update({ ctaTiles: v })}
          />
        </FormGroup>
      </div>

      <SaveBar
        onSave={save}
        saving={saving}
        dirty={dirty}
        saved={savedAt !== null}
        error={error}
      />
    </div>
  );
}

function MetaRowsEditor({
  value,
  onChange,
}: {
  value: MetaRow[];
  onChange: (v: MetaRow[]) => void;
}) {
  const update = (idx: number, patch: Partial<MetaRow>) =>
    onChange(value.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  const add = () => onChange([...value, { label: "", value: "" }]);

  return (
    <div className="flex flex-col gap-3">
      {value.map((row, idx) => (
        <div
          key={idx}
          className="grid grid-cols-[200px_1fr_auto] items-start gap-3 border border-base-200 bg-base-100 p-3"
        >
          <input
            type="text"
            value={row.label}
            onChange={(e) => update(idx, { label: e.target.value })}
            placeholder="Класс жилья"
            className="h-10 w-full border border-base-200 bg-base-0 px-3 font-sans text-body outline-none focus:border-accent"
          />
          <div className="flex flex-col gap-2">
            <textarea
              value={row.value}
              onChange={(e) => update(idx, { value: e.target.value })}
              placeholder="Премиум"
              rows={2}
              className="block w-full resize-y border border-base-200 bg-base-0 px-3 py-2 font-sans text-body outline-none focus:border-accent"
            />
            <label className="flex items-center gap-2 font-sans text-small text-base-600">
              <input
                type="checkbox"
                checked={Boolean(row.dim)}
                onChange={(e) => update(idx, { dim: e.target.checked })}
              />
              Приглушённый цвет
            </label>
          </div>
          <button
            type="button"
            onClick={() => remove(idx)}
            className="h-9 border border-base-200 bg-base-0 px-3 font-sans text-small font-medium text-base-600 hover:bg-base-100"
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
        + Добавить строку
      </button>
    </div>
  );
}

function CtaTilesEditor({
  value,
  onChange,
}: {
  value: CtaTile[];
  onChange: (v: CtaTile[]) => void;
}) {
  const update = (idx: number, patch: Partial<CtaTile>) =>
    onChange(value.map((t, i) => (i === idx ? { ...t, ...patch } : t)));

  return (
    <div className="grid grid-cols-2 gap-4">
      {value.map((tile, idx) => (
        <div key={idx} className="flex flex-col gap-3 border border-base-200 bg-base-100 p-4">
          <TextField
            label="Заголовок"
            value={tile.title}
            onChange={(v) => update(idx, { title: v })}
            placeholder="Видео о проекте"
          />
          <TextField
            label="Подпись"
            value={tile.sub}
            onChange={(v) => update(idx, { sub: v })}
            placeholder="Узнайте больше"
          />
          <UrlField
            label="Ссылка"
            value={tile.url}
            onChange={(v) => update(idx, { url: v })}
          />
          <label className="block">
            <span className="mb-1 block font-sans text-upper uppercase tracking-wide text-base-600">
              Иконка
            </span>
            <select
              value={tile.icon}
              onChange={(e) =>
                update(idx, { icon: e.target.value as CtaTile["icon"] })
              }
              className="h-10 w-full border border-base-200 bg-base-0 px-3 outline-none"
            >
              <option value="play">▶ Play (видео)</option>
              <option value="arrow">→ Стрелка</option>
            </select>
          </label>
        </div>
      ))}
    </div>
  );
}
