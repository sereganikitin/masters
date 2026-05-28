import { useCmsSection } from "@/lib/useCmsSection";
import {
  FormGroup,
  ImageField,
  SaveBar,
  StringListField,
  TextAreaField,
  TextField,
  UrlField,
} from "@/components/admin/CmsField";
import { Loading, SectionHeader } from "@/screens/admin/SiteHeaderSection";

export interface AboutConstructionContent {
  /** Inline meta — "Корпус 2" filter chip. */
  building: string;
  /** Inline meta — "Август 2025" filter chip. */
  period: string;
  intro: string;
  bullets: string[];
  photo: string;
  galleryLabel: string;
  /** Не используется — кнопка ведёт на встроенный экран. Поле оставлено для будущего внешнего редиректа. */
  galleryUrl: string;
}

const DEFAULTS: AboutConstructionContent = {
  building: "Корпус 2",
  period: "Август 2025",
  intro:
    "В августе работы были сконцентрированы на возведении вертикальных конструкций и подготовке к монтажу уникальных фасадных решений.",
  bullets: [
    "Монолитные работы: заливка колонн и плит перекрытий с 8-го по 12-й этажи.",
    "Фасадные работы: подготовка к монтажу алюминиевых панелей и элементов остекления.",
    "Начало работ по формированию ландшафта.",
  ],
  photo: "/images/about/construction.png",
  galleryLabel: "Смотреть галерею",
  galleryUrl: "",
};

export function AboutConstructionSection() {
  const { draft, update, save, saving, savedAt, dirty, error, loaded } =
    useCmsSection<AboutConstructionContent>("about.construction", DEFAULTS);

  if (!loaded) return <Loading />;

  return (
    <div className="flex h-screen flex-col">
      <SectionHeader
        title="Динамика строительства — текущая"
        subtitle="Блок, показываемый на странице. Все архивные месяцы — в галерее."
      />

      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        <FormGroup title="Метки (чипы)">
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Корпус"
              value={draft.building}
              onChange={(v) => update({ building: v })}
              placeholder="Корпус 2"
            />
            <TextField
              label="Период"
              value={draft.period}
              onChange={(v) => update({ period: v })}
              placeholder="Август 2025"
            />
          </div>
        </FormGroup>

        <FormGroup title="Текст">
          <TextAreaField
            label="Вводный абзац"
            value={draft.intro}
            onChange={(v) => update({ intro: v })}
            rows={3}
          />
          <StringListField
            label="Маркированный список"
            value={draft.bullets}
            onChange={(v) => update({ bullets: v })}
            placeholder="Монолитные работы: …"
          />
        </FormGroup>

        <FormGroup title="Фото справа">
          <ImageField
            label="Фото"
            value={draft.photo}
            onChange={(v) => update({ photo: v })}
            recommended="1200×1500 (4:5, портрет)"
          />
        </FormGroup>

        <FormGroup
          title="Кнопка «Смотреть галерею»"
          description="Открывает встроенный экран со всеми месяцами. Контент галереи — в разделе «Динамика — галерея»."
        >
          <TextField
            label="Подпись"
            value={draft.galleryLabel}
            onChange={(v) => update({ galleryLabel: v })}
            placeholder="Смотреть галерею"
          />
          <UrlField
            label="Внешняя ссылка (опционально)"
            value={draft.galleryUrl}
            onChange={(v) => update({ galleryUrl: v })}
            placeholder="Оставьте пустым — откроется встроенная галерея"
            hint="Если указать URL, кнопка пойдёт по нему вместо встроенной галереи"
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
