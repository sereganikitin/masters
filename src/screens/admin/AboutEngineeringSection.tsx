import { useCmsSection } from "@/lib/useCmsSection";
import {
  FormGroup,
  ImageField,
  SaveBar,
  StringListField,
  TextField,
  UrlField,
} from "@/components/admin/CmsField";
import { Loading, SectionHeader } from "@/screens/admin/SiteHeaderSection";

export interface AboutEngineeringContent {
  eyebrow: string;
  heading: string;
  paragraphs: string[];
  photo: string;
  ctaLabel: string;
  ctaUrl: string;
}

const DEFAULTS: AboutEngineeringContent = {
  eyebrow: "Мастерство в деталях",
  heading: "Инженерные\nсистемы",
  paragraphs: [
    "В квартирах предусмотрены естественная вентиляция через открывающиеся створки и приточные клапаны, а также центральная система кондиционирования — остаётся установить только внутренний блок. Вода проходит многоступенчатую очистку (механическая фильтрация, умягчение и тонкая очистка).",
    "Предусмотрены повышенные электрические мощности, а для квартир с террасами — дополнительные. В лобби и общественных зонах поддерживается комфортный микроклимат, горячая вода подаётся сразу благодаря рециркуляции. Для удобства жителей доступен Wi-Fi в лобби и на придомовой территории, а связь усилена в паркинге и лифтах.",
  ],
  photo: "/images/about/engineering.png",
  ctaLabel: "Заказать звонок",
  ctaUrl: "",
};

export function AboutEngineeringSection() {
  const { draft, update, save, saving, savedAt, dirty, error, loaded } =
    useCmsSection<AboutEngineeringContent>("about.engineering", DEFAULTS);

  if (!loaded) return <Loading />;

  return (
    <div className="flex h-screen flex-col">
      <SectionHeader
        title="Инженерные системы"
        subtitle="Тёмная секция: большой заголовок слева, фото и кнопка справа."
      />

      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        <FormGroup title="Заголовок">
          <TextField
            label="Eyebrow (подпись над заголовком)"
            value={draft.eyebrow}
            onChange={(v) => update({ eyebrow: v })}
            placeholder="Мастерство в деталях"
          />
          <TextField
            label="Заголовок (можно с переносом)"
            value={draft.heading}
            onChange={(v) => update({ heading: v })}
            placeholder={"Инженерные\nсистемы"}
            hint="Перенос строки = новая строка в заголовке"
          />
        </FormGroup>

        <FormGroup title="Текст" description="Два абзаца внизу левой колонки.">
          <StringListField
            label="Абзацы"
            value={draft.paragraphs}
            onChange={(v) => update({ paragraphs: v })}
            multiline
          />
        </FormGroup>

        <FormGroup title="Фото справа">
          <ImageField
            label="Фото"
            value={draft.photo}
            onChange={(v) => update({ photo: v })}
            recommended="900×1200 (3:4, портрет)"
          />
        </FormGroup>

        <FormGroup title="Кнопка под фото">
          <TextField
            label="Подпись"
            value={draft.ctaLabel}
            onChange={(v) => update({ ctaLabel: v })}
            placeholder="Заказать звонок"
          />
          <UrlField
            label="Ссылка (или tel:)"
            value={draft.ctaUrl}
            onChange={(v) => update({ ctaUrl: v })}
            placeholder="tel:+74950211111"
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
