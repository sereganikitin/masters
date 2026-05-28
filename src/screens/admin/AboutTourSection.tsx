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

export interface AboutTourContent {
  eyebrow: string;
  paragraphs: string[];
  thumbImage: string;
  ctaLabel: string;
  ctaUrl: string;
}

const DEFAULTS: AboutTourContent = {
  eyebrow: "Виртуальный тур",
  paragraphs: [
    "Взгляните на район дома «Мастерс» с нового ракурса в нашем интерактивном 3D-туре. Переключайтесь между дневным и вечерним временем, чтобы оценить панорамные виды Петровского парка, стадиона «ВЭБ Арена» и делового центра Москва-Сити.",
    "Это уникальный шанс изучить среду, масштаб и перспективы будущего дома, прежде чем сделать решающий выбор.",
  ],
  thumbImage: "/images/about/tour-thumb.png",
  ctaLabel: "Смотреть 3D тур",
  ctaUrl: "/tour",
};

export function AboutTourSection() {
  const { draft, update, save, saving, savedAt, dirty, error, loaded } =
    useCmsSection<AboutTourContent>("about.tour", DEFAULTS);

  if (!loaded) return <Loading />;

  return (
    <div className="flex h-screen flex-col">
      <SectionHeader
        title="3D-тур"
        subtitle="Маленькое фото-обтекание + центральная тёмная кнопка."
      />

      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        <FormGroup title="Заголовок (eyebrow)">
          <TextField
            label="Подпись слева"
            value={draft.eyebrow}
            onChange={(v) => update({ eyebrow: v })}
            placeholder="Виртуальный тур"
          />
        </FormGroup>

        <FormGroup title="Текст" description="Два абзаца, обтекающие маленькое фото.">
          <StringListField
            label="Абзацы"
            value={draft.paragraphs}
            onChange={(v) => update({ paragraphs: v })}
            multiline
          />
        </FormGroup>

        <FormGroup title="Маленькое фото (внутри текста)">
          <ImageField
            label="Превью"
            value={draft.thumbImage}
            onChange={(v) => update({ thumbImage: v })}
            recommended="240×240 (1:1)"
          />
        </FormGroup>

        <FormGroup title="Кнопка под текстом">
          <TextField
            label="Подпись"
            value={draft.ctaLabel}
            onChange={(v) => update({ ctaLabel: v })}
            placeholder="Смотреть 3D тур"
          />
          <UrlField
            label="Ссылка"
            value={draft.ctaUrl}
            onChange={(v) => update({ ctaUrl: v })}
            placeholder="/tour или https://…"
            hint="Внутренний роут (/tour) или внешняя URL"
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
