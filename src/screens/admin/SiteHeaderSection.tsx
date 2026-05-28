import { useCmsSection } from "@/lib/useCmsSection";
import {
  FormGroup,
  SaveBar,
  StringListField,
  TextField,
  UrlField,
} from "@/components/admin/CmsField";

export interface SiteHeaderContent {
  phone: string;
  phoneHref: string;
  brand: string;
  brandLine: string;
  menuItems: { label: string; href: string }[];
}

const DEFAULTS: SiteHeaderContent = {
  phone: "+7 (495) 021-11-11",
  phoneHref: "tel:+74950211111",
  brand: "Capital Group",
  brandLine: "CG",
  menuItems: [
    { label: "Выбрать квартиру", href: "/catalog" },
    { label: "О компании", href: "#" },
    { label: "Контакты", href: "#" },
  ],
};

export function SiteHeaderSection() {
  const { draft, update, save, saving, savedAt, dirty, error, loaded } =
    useCmsSection<SiteHeaderContent>("site.header", DEFAULTS);

  if (!loaded) return <Loading />;

  return (
    <div className="flex h-screen flex-col">
      <SectionHeader
        title="Шапка сайта"
        subtitle="Логотип, контакты и навигация — отображается на всех страницах с PageHeader."
      />

      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        <FormGroup title="Брендинг">
          <TextField
            label="Название"
            value={draft.brand}
            onChange={(v) => update({ brand: v })}
            placeholder="Capital Group"
          />
          <TextField
            label="Логотип (текст квадрата)"
            value={draft.brandLine}
            onChange={(v) => update({ brandLine: v })}
            placeholder="CG"
            hint="2 буквы, отображаются на чёрном квадрате"
          />
        </FormGroup>

        <FormGroup title="Контакты">
          <TextField
            label="Телефон (визуальный)"
            value={draft.phone}
            onChange={(v) => update({ phone: v })}
            placeholder="+7 (495) 021-11-11"
          />
          <UrlField
            label="Телефон (ссылка)"
            value={draft.phoneHref}
            onChange={(v) => update({ phoneHref: v })}
            placeholder="tel:+74950211111"
            hint="Для tel: или mailto:"
          />
        </FormGroup>

        <FormGroup title="Меню" description="Пункты меню в шапке. Слева направо.">
          <MenuItemsEditor
            value={draft.menuItems}
            onChange={(v) => update({ menuItems: v })}
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

function MenuItemsEditor({
  value,
  onChange,
}: {
  value: { label: string; href: string }[];
  onChange: (v: { label: string; href: string }[]) => void;
}) {
  const labels = value.map((v) => v.label);
  const hrefs = value.map((v) => v.href);

  const setLabels = (next: string[]) =>
    onChange(next.map((label, i) => ({ label, href: hrefs[i] ?? "" })));
  const setHrefs = (next: string[]) =>
    onChange(next.map((href, i) => ({ label: labels[i] ?? "", href })));

  return (
    <div className="grid grid-cols-2 gap-5">
      <StringListField
        label="Подписи"
        value={labels}
        onChange={setLabels}
        placeholder="Выбрать квартиру"
      />
      <StringListField
        label="Ссылки"
        value={hrefs}
        onChange={setHrefs}
        placeholder="/catalog или https://…"
        hint="Внутренняя ссылка (/…) или внешняя"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared mini-helpers (used by every section)
// ─────────────────────────────────────────────────────────────────────────────

export function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="border-b border-base-200 bg-base-0 px-6 py-5">
      <h2 className="font-display text-h4 font-semibold text-base-800">{title}</h2>
      {subtitle && <p className="mt-1 font-sans text-small text-base-600">{subtitle}</p>}
    </header>
  );
}

export function Loading() {
  return (
    <div className="grid h-screen place-items-center">
      <p className="font-sans text-body text-base-600">Загрузка…</p>
    </div>
  );
}
