import { useNavigate, useParams } from "react-router-dom";
import { OverlayChrome } from "@/components/OverlayChrome";
import { Reveal } from "@/components/Reveal";
import { Pressable } from "@/components/Pressable";
import { PlanImage } from "@/components/PlanImage";
import { getApartment, formatArea, formatPrice, roomTypeLabel } from "@/data/complex";
import { apartmentPlanUrl } from "@/lib/plans";

export function ApartmentScreen() {
  const { apartmentId } = useParams();
  const nav = useNavigate();
  const apt = apartmentId ? getApartment(apartmentId) : undefined;

  if (!apt) {
    return (
      <div className="grid h-full place-items-center bg-base-100">
        <div className="text-center">
          <p className="font-display text-h3">Квартира не найдена</p>
          <Pressable
            onClick={() => nav("/genplan")}
            className="mt-6 bg-accent px-6 py-3 font-sans text-body text-base-0"
          >
            К генплану
          </Pressable>
        </div>
      </div>
    );
  }

  const features: { label: string; value: string }[] = [
    { label: "Тип", value: roomTypeLabel(apt.roomType) },
    { label: "Этаж", value: String(apt.floor) },
    { label: "Секция", value: String(apt.sectionNumber) },
    { label: "Площадь", value: formatArea(apt.area) },
    { label: "Жилая", value: formatArea(apt.livingArea) },
    { label: "Цена за м²", value: formatPrice(apt.pricePerMeter) },
    { label: "Отделка", value: apt.decoration || "—" },
    { label: "Балконы", value: String(apt.features.balconyCount || 0) },
    { label: "Лоджии", value: String(apt.features.loggiaCount || 0) },
  ];

  const perks = [
    apt.features.cornerGlazing && "Угловое остекление",
    apt.features.largeKitchenLivingRoom && "Кухня-гостиная",
    apt.features.masterBedroom && "Мастер-спальня",
  ].filter(Boolean) as string[];

  return (
    <div className="relative h-full w-full bg-base-100">
      <OverlayChrome
        onBack={() => nav(`/floor/${apt.sectionNumber}/${apt.floor}`)}
        backLabel={`Этаж ${apt.floor}`}
      />

      <div className="absolute inset-x-10 bottom-10 top-10 grid grid-cols-[1.4fr_1fr] gap-6 pl-44">
        {/* Plan */}
        <Reveal mode="left" delay={80} className="h-full">
          <div className="relative h-full overflow-hidden bg-base-0 shadow-card">
            <div className="absolute left-8 top-8 z-10 font-sans text-small uppercase tracking-[0.2em] text-base-600">
              План квартиры
            </div>
            {/* Padded box that constrains the image. The inner div has fixed inset
              * padding so object-contain has a real bounding box (h-full inside grid
              * doesn't constrain an img — we need absolute positioning). */}
            <div className="absolute inset-0 px-20 pb-16 pt-24">
              <PlanImage
                src={apartmentPlanUrl(apt)}
                alt={`План квартиры №${apt.number}`}
                className="h-full w-full object-contain"
                fallback={
                  <div className="grid h-full w-full place-items-center text-center font-sans text-h5 text-base-600">
                    <div>
                      <p>План №{apt.number}</p>
                      <p className="mt-2 text-small">Изображение не загрузилось</p>
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        </Reveal>

        {/* Details */}
        <Reveal mode="right" delay={120} className="h-full">
          <div className="flex h-full flex-col gap-6 overflow-y-auto bg-base-0 p-8 shadow-card">
            <Reveal mode="up" delay={150}>
              <div>
                <p className="font-sans text-upper uppercase tracking-[0.25em] text-base-600">
                  Квартира №{apt.number}
                </p>
                <h2 className="mt-2 font-display text-[44px] font-semibold leading-none text-base-800">
                  {roomTypeLabel(apt.roomType)}, {formatArea(apt.area)}
                </h2>
              </div>
            </Reveal>

            <Reveal mode="up" delay={220}>
              <div className="bg-base-100 p-6">
                <p className="font-sans text-small text-base-600">Стоимость</p>
                <p className="mt-1 font-display text-[40px] font-semibold leading-none text-accent">
                  {formatPrice(apt.price)}
                </p>
                <p className="mt-2 font-sans text-small text-base-600">
                  {formatPrice(apt.pricePerMeter)} за м²
                </p>
              </div>
            </Reveal>

            <Reveal mode="up" delay={300}>
              <div className="divide-y divide-base-200">
                {features.map((f) => (
                  <div key={f.label} className="grid grid-cols-[1fr_auto] gap-4 py-3">
                    <span className="font-sans text-body text-base-600">{f.label}</span>
                    <span className="font-sans text-body font-medium text-base-800">{f.value}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            {perks.length > 0 && (
              <Reveal mode="up" delay={380}>
                <div>
                  <p className="font-sans text-upper uppercase tracking-[0.25em] text-base-600">
                    Особенности
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {perks.map((p) => (
                      <span
                        key={p}
                        className="bg-base-100 px-4 py-2 font-sans text-small font-medium text-base-700"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            <Reveal mode="up" delay={450} className="mt-auto">
              <Pressable
                rippleColor="rgba(255,255,255,0.25)"
                className="flex h-16 w-full items-center justify-center bg-accent font-sans text-h5 font-medium text-base-0"
              >
                Получить консультацию
              </Pressable>
            </Reveal>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
