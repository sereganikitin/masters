import { useCmsSection } from "@/lib/useCmsSection";
import {
  FormGroup,
  ImageField,
  NumberField,
  SaveBar,
  TextAreaField,
  TextField,
  UrlField,
} from "@/components/admin/CmsField";
import { Loading, SectionHeader } from "@/screens/admin/SiteHeaderSection";

export interface AboutOfficeContent {
  title: string;
  address: string;
  phone: string;
  photo: string;
  mapImage: string;
  mapLat: number;
  mapLng: number;
  mapZoom: number;
  ctaLabel: string;
  routeUrl: string;
}

const DEFAULTS: AboutOfficeContent = {
  title: "Офис продаж\n«Мастерс»",
  address: "г. Москва, Проезд Аэропорта, 8",
  phone: "+7 (495) 021-11-11",
  photo: "/images/about/office.png",
  mapImage: "/images/about/office-map.png",
  mapLat: 55.797296,
  mapLng: 37.521792,
  mapZoom: 17,
  ctaLabel: "Проложить маршрут",
  routeUrl: "https://yandex.ru/maps/?text=Москва Проезд Аэропорта 8",
};

export function AboutOfficeSection() {
  const { draft, update, save, saving, savedAt, dirty, error, loaded } =
    useCmsSection<AboutOfficeContent>("about.office", DEFAULTS);

  if (!loaded) return <Loading />;

  return (
    <div className="flex h-screen flex-col">
      <SectionHeader
        title="Офис продаж"
        subtitle="Полноширинная карта района с карточкой офиса в правом нижнем углу."
      />

      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        <FormGroup title="Карточка офиса">
          <TextAreaField
            label="Заголовок"
            value={draft.title}
            onChange={(v) => update({ title: v })}
            placeholder={"Офис продаж\n«Мастерс»"}
            rows={2}
            hint="Перенос строки = новая строка"
          />
          <TextField
            label="Адрес"
            value={draft.address}
            onChange={(v) => update({ address: v })}
            placeholder="г. Москва, Проезд Аэропорта, 8"
          />
          <TextField
            label="Телефон"
            value={draft.phone}
            onChange={(v) => update({ phone: v })}
            placeholder="+7 (495) 021-11-11"
          />
        </FormGroup>

        <FormGroup title="Фото офиса">
          <ImageField
            label="Фото офиса (вверху карточки)"
            value={draft.photo}
            onChange={(v) => update({ photo: v })}
            recommended="880×495 (16:9)"
          />
        </FormGroup>

        <FormGroup
          title="Карта района"
          description="Живая Яндекс-карта с маркером в центре. Подскажу координаты: открой Яндекс-карты, кликни правой кнопкой на нужную точку → «Что здесь?» → внизу появятся coordinates вида 55.8013, 37.5310 — первое значение это Lat, второе Lng."
        >
          <div className="grid grid-cols-3 gap-4">
            <NumberField
              label="Latitude"
              value={draft.mapLat}
              onChange={(v) => update({ mapLat: v })}
              hint="55.8013 и т.п."
            />
            <NumberField
              label="Longitude"
              value={draft.mapLng}
              onChange={(v) => update({ mapLng: v })}
              hint="37.5310 и т.п."
            />
            <NumberField
              label="Zoom"
              value={draft.mapZoom}
              onChange={(v) => update({ mapZoom: v })}
              min={1}
              max={19}
              hint="14–17 — городской уровень"
            />
          </div>
          <ImageField
            label="Резервная картинка (если карта не загрузится)"
            value={draft.mapImage}
            onChange={(v) => update({ mapImage: v })}
            recommended="1692×991, тёмный стиль"
          />
        </FormGroup>

        <FormGroup title="Кнопка маршрута">
          <TextField
            label="Подпись"
            value={draft.ctaLabel}
            onChange={(v) => update({ ctaLabel: v })}
            placeholder="Проложить маршрут"
          />
          <UrlField
            label="Ссылка на карты"
            value={draft.routeUrl}
            onChange={(v) => update({ routeUrl: v })}
            placeholder="https://yandex.ru/maps/?text=…"
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
