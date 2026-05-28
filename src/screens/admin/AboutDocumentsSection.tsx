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

export interface AboutDocumentsContent {
  eyebrow: string;
  body: string;
  logo: string;
  ctaLabel: string;
  docsUrl: string;
}

const DEFAULTS: AboutDocumentsContent = {
  eyebrow: "Документы",
  body: "Вся проектная документация доступна на официальном портале ДОМ.РФ. Здесь вы найдёте актуальные планы, разрешения, проектные декларации и другие официальные материалы для детального изучения.",
  logo: "",
  ctaLabel: "Изучить документы",
  docsUrl:
    "https://%D0%BD%D0%B0%D1%88.%D0%B4%D0%BE%D0%BC.%D1%80%D1%84/%D1%81%D0%B5%D1%80%D0%B2%D0%B8%D1%81%D1%8B/%D0%BA%D0%B0%D1%82%D0%B0%D0%BB%D0%BE%D0%B3-%D0%BD%D0%BE%D0%B2%D0%BE%D1%81%D1%82%D1%80%D0%BE%D0%B5%D0%BA/%D0%BE%D0%B1%D1%8A%D0%B5%D0%BA%D1%82/70548",
};

export function AboutDocumentsSection() {
  const { draft, update, save, saving, savedAt, dirty, error, loaded } =
    useCmsSection<AboutDocumentsContent>("about.documents", DEFAULTS);

  if (!loaded) return <Loading />;

  return (
    <div className="flex h-screen flex-col">
      <SectionHeader
        title="Документы"
        subtitle="Eyebrow слева, текст с маленьким логотипом-обтеканием, тёмная кнопка."
      />

      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        <FormGroup title="Заголовок">
          <TextField
            label="Eyebrow"
            value={draft.eyebrow}
            onChange={(v) => update({ eyebrow: v })}
            placeholder="Документы"
          />
        </FormGroup>

        <FormGroup title="Описание">
          <TextAreaField
            label="Основной текст"
            value={draft.body}
            onChange={(v) => update({ body: v })}
            rows={5}
          />
        </FormGroup>

        <FormGroup title="Логотип источника (ДОМ.РФ)">
          <ImageField
            label="Логотип"
            value={draft.logo}
            onChange={(v) => update({ logo: v })}
            recommended="180×180 (1:1), на сером фоне"
          />
        </FormGroup>

        <FormGroup title="Кнопка">
          <TextField
            label="Подпись"
            value={draft.ctaLabel}
            onChange={(v) => update({ ctaLabel: v })}
            placeholder="Изучить документы"
          />
          <UrlField
            label="Ссылка на документы"
            value={draft.docsUrl}
            onChange={(v) => update({ docsUrl: v })}
            placeholder="https://наш.дом.рф/…"
            hint="Можно вставить кириллическую ссылку — браузер декодирует"
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
