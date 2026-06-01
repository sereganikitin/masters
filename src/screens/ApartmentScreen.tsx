import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { OverlayChrome } from "@/components/OverlayChrome";
import { Reveal } from "@/components/Reveal";
import { Pressable } from "@/components/Pressable";
import { PlanImage } from "@/components/PlanImage";
import { OverlayLayer } from "@/components/OverlayLayer";
import { GenplanCanvas } from "@/components/GenplanCanvas";
import { useOverlays } from "@/lib/useOverlays";
import {
  getApartment,
  getHouse,
  formatArea,
  formatPrice,
  roomTypeLabel,
} from "@/data/complex";
import { apartmentPlanUrl, floorPlanUrl } from "@/lib/plans";
import { IconArrowRight, IconMap, IconHome } from "@/components/Icon";
import type { Apartment } from "@/data/types";

// Subsidised-mortgage estimate per Figma. Standard kiosk assumption:
// 6% annual rate, 20% down-payment, 20-year term (240 months).
function monthlyMortgage(price: number): number {
  const credit = price * 0.8;
  const r = 0.06 / 12;
  const n = 240;
  const factor = (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(credit * factor);
}

const RUB = (n: number) => `${Math.round(n).toLocaleString("ru-RU")} ₽`;

type PlanTab = "plan" | "floor" | "genplan" | "views";

export function ApartmentScreen() {
  const { apartmentId } = useParams();
  const nav = useNavigate();
  const apt = apartmentId ? getApartment(apartmentId) : undefined;
  const house = getHouse();
  const [planTab, setPlanTab] = useState<PlanTab>("plan");

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

  // Tags row — derived from feed flags.
  const tags: { label: string; tone?: "outline" }[] = [];
  if (apt.decoration) tags.push({ label: apt.decoration, tone: "outline" });
  if (apt.features.largeKitchenLivingRoom)
    tags.push({ label: "Кухня-гостиная", tone: "outline" });
  if (apt.features.masterBedroom) tags.push({ label: "Мастер-спальня", tone: "outline" });
  if (apt.features.cornerGlazing)
    tags.push({ label: "Угловое остекление", tone: "outline" });
  if (apt.features.balconyCount > 0) tags.push({ label: "Балкон", tone: "outline" });
  if (apt.features.loggiaCount > 0) tags.push({ label: "Лоджия", tone: "outline" });

  const VISIBLE = 3;
  const visibleTags = tags.slice(0, VISIBLE);
  const moreCount = Math.max(0, tags.length - VISIBLE);

  // 4-tab in-card view switcher per the latest Figma. «Вид из окон» is a
  // placeholder until the panorama feed is wired up.
  const planTabs: { key: PlanTab; label: string; disabled?: boolean }[] = [
    { key: "plan", label: "Планировка" },
    { key: "floor", label: "На этаже" },
    { key: "genplan", label: "Генплан" },
    { key: "views", label: "Вид из окон", disabled: true },
  ];

  const monthly = monthlyMortgage(apt.price);

  return (
    <div className="relative h-full w-full bg-base-100">
      <OverlayChrome
        onBack={() => nav(`/catalog?section=${apt.sectionNumber}`)}
        backLabel={`Секция ${apt.sectionNumber}`}
      />

      <div className="absolute inset-x-10 bottom-10 top-10 grid grid-cols-[1fr_480px] gap-6 pl-44">
        {/* Plan column */}
        <Reveal mode="left" delay={80} className="h-full">
          <div className="relative flex h-full flex-col bg-base-0 shadow-card">
            {/* Plan canvas — switches with the bottom tabs without leaving the screen. */}
            <div className="relative min-h-0 flex-1">
              <PlanTabContent tab={planTab} apt={apt} />

              {/* Lot number badge, only on the apartment plan view */}
              {planTab === "plan" && (
                <div className="pointer-events-none absolute left-8 top-8 font-display text-[14px] font-medium uppercase tracking-[0.2em] text-base-600">
                  №{apt.number}
                </div>
              )}
            </div>

            {/* Bottom toolbar — in-card tab switcher */}
            <div className="flex-shrink-0 border-t border-base-200 px-8 py-6">
              <div className="flex items-center gap-3">
                {planTabs.map((t) => {
                  const isActive = planTab === t.key;
                  return (
                    <Pressable
                      key={t.key}
                      onClick={() => !t.disabled && setPlanTab(t.key)}
                      disabled={t.disabled}
                      rippleColor={
                        isActive ? "rgba(255,255,255,0.25)" : "rgba(0,97,166,0.12)"
                      }
                      className={`h-14 px-8 font-sans text-body font-medium transition-colors ${
                        t.disabled
                          ? "cursor-not-allowed border border-base-200 bg-base-0 text-base-800/35"
                          : isActive
                            ? "bg-night-500 text-base-0"
                            : "border border-base-600 bg-base-0 text-base-800"
                      }`}
                      title={t.disabled ? "Появится позже" : undefined}
                    >
                      {t.label}
                    </Pressable>
                  );
                })}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Right info panel */}
        <Reveal mode="right" delay={120} className="h-full">
          <div className="flex h-full flex-col bg-night-500 text-base-0 shadow-card">
            <div
              className="flex-1 overflow-y-auto px-8 py-8"
              style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
            >
              {/* Tag row */}
              {visibleTags.length > 0 && (
                <Reveal mode="up" delay={120}>
                  <div className="flex flex-wrap gap-2">
                    {visibleTags.map((t) => (
                      <span
                        key={t.label}
                        className="border border-base-0/30 bg-transparent px-3 py-1.5 font-sans text-[12px] font-medium text-base-0"
                      >
                        {t.label}
                      </span>
                    ))}
                    {moreCount > 0 && (
                      <span className="border border-base-0/30 bg-transparent px-3 py-1.5 font-sans text-[12px] font-medium text-base-0">
                        Еще +{moreCount}
                      </span>
                    )}
                  </div>
                </Reveal>
              )}

              {/* Meta rows */}
              <Reveal mode="up" delay={180}>
                <dl className="mt-8 grid grid-cols-[140px_1fr] gap-y-2 font-sans text-small">
                  <dt className="text-base-0/55">Проект</dt>
                  <dd className="text-right font-medium text-base-0">МАСТЕРС</dd>
                  <dt className="text-base-0/55">В ипотеку</dt>
                  <dd className="text-right font-medium text-base-0">от {RUB(monthly)}/мес.</dd>
                  <dt className="text-base-0/55">Номер лота</dt>
                  <dd className="text-right font-medium text-base-0">{apt.number}</dd>
                  <dt className="text-base-0/55">Цена за м²</dt>
                  <dd className="text-right font-medium text-base-0">
                    {formatPrice(apt.pricePerMeter)}
                  </dd>
                </dl>
              </Reveal>

              {/* Main heading + price */}
              <Reveal mode="up" delay={240}>
                <div className="mt-10">
                  <h2 className="font-display text-[28px] font-semibold uppercase leading-none tracking-[0.02em]">
                    {roomTypeLabel(apt.roomType)}, {formatArea(apt.area)}
                  </h2>
                  <p className="mt-4 font-display text-[28px] font-semibold uppercase leading-none tracking-[0.02em]">
                    {formatPrice(apt.price)}
                  </p>
                </div>
              </Reveal>

              {/* Detail row — corpus / section / floor / completion */}
              <Reveal mode="up" delay={300}>
                <div className="mt-10 grid grid-cols-2 gap-y-3 border-y border-base-0/15 py-5 font-sans text-small">
                  <span className="text-base-0/55">Корпус</span>
                  <span className="text-right font-medium">{house.number}</span>
                  <span className="text-base-0/55">Секция</span>
                  <span className="text-right font-medium">{apt.sectionNumber}</span>
                  <span className="text-base-0/55">Этаж</span>
                  <span className="text-right font-medium">
                    {apt.floor} из {house.highFloor}
                  </span>
                  <span className="text-base-0/55">Сдача</span>
                  <span className="text-right font-medium">{house.endDate}</span>
                </div>
              </Reveal>

              {/* Booking CTA */}
              <Reveal mode="up" delay={360}>
                <Pressable
                  rippleColor="rgba(255,255,255,0.25)"
                  className="mt-8 flex h-14 w-full items-center justify-between bg-accent px-6 font-sans text-body font-medium text-base-0"
                >
                  Забронировать
                  <IconArrowRight size={18} />
                </Pressable>
              </Reveal>

              {/* Sub-offers — storage / parking / mortgage calc */}
              <Reveal mode="up" delay={420}>
                <div className="mt-8 grid grid-cols-3 gap-3">
                  <OfferCard
                    icon={<IconMap size={18} />}
                    title="Машино-место"
                    note="от 1,7 млн ₽"
                  />
                  <OfferCard
                    icon={<IconHome size={18} />}
                    title="Кладовая"
                    note="от 800 тыс ₽"
                  />
                  <OfferCard
                    icon={<IconArrowRight size={18} />}
                    title="Ипотека"
                    note={`от ${RUB(monthly)}/мес.`}
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab content — apartment plan / floor plan / genplan / views placeholder
// ─────────────────────────────────────────────────────────────────────────────

function PlanTabContent({ tab, apt }: { tab: PlanTab; apt: Apartment }) {
  switch (tab) {
    case "plan":
      return (
        <PlanImage
          src={apartmentPlanUrl(apt)}
          alt={`План квартиры №${apt.number}`}
          className="absolute inset-0 h-full w-full object-contain p-16"
          fallback={
            <div className="grid h-full place-items-center font-sans text-h5 text-base-600">
              План №{apt.number} не загрузился
            </div>
          }
        />
      );
    case "floor":
      return <FloorPlanView apt={apt} />;
    case "genplan":
      return <GenplanView apt={apt} />;
    case "views":
      return (
        <div className="grid h-full place-items-center px-12 text-center">
          <div>
            <p className="font-display text-h4 font-semibold text-base-800">
              Вид из окон
            </p>
            <p className="mt-3 max-w-[420px] font-sans text-body text-base-600">
              Появится позже — после интеграции с панорамным фидом.
            </p>
          </div>
        </div>
      );
  }
}

/**
 * Wrap children in a 16:9 box centred inside the parent. The polygon overlays
 * are drawn at fixed 1920×1080 coordinates and rendered with
 * preserveAspectRatio="none", so they only align with the photo if photo and
 * SVG fill an area that has the same aspect ratio as 1920×1080.
 * Without this wrapper, embedded views (smaller, squarer card area) stretched
 * the overlay but cover-cropped the photo, knocking the outlines out of place.
 */
function StageBox({ children }: { children: React.ReactNode }) {
  // Sandwich the 16:9 box between two `1fr` spacer rows so the extra
  // vertical space is split equally above and below. Previous attempts
  // (place-items / flex items-center + padding-bottom) consistently
  // collapsed the 16:9 row to the top in this layout context.
  return (
    <div
      className="grid h-full w-full bg-night-500/5"
      style={{ gridTemplateRows: "1fr auto 1fr" }}
    >
      <div />
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <div className="absolute inset-0">{children}</div>
      </div>
      <div />
    </div>
  );
}

function FloorPlanView({ apt }: { apt: Apartment }) {
  // Locate the overlay drawn for this specific apartment so we can highlight it
  // among all lots on the floor plan.
  const { overlays } = useOverlays("floor", `${apt.sectionNumber}_${apt.floor}`);
  const highlight = overlays.find((o) => o.entityId === apt.id);
  return (
    <StageBox>
      <PlanImage
        src={floorPlanUrl(apt.sectionNumber, apt.floor)}
        alt={`План этажа ${apt.floor}, секция ${apt.sectionNumber}`}
        className="absolute inset-0 h-full w-full object-contain p-12"
        fallback={
          <div className="grid h-full place-items-center font-sans text-h5 text-base-600">
            План этажа недоступен
          </div>
        }
      />
      <OverlayLayer
        scope="floor"
        scopeKey={`${apt.sectionNumber}_${apt.floor}`}
        highlightId={highlight?.id ?? null}
        showLabels={false}
      />
      <div className="pointer-events-none absolute left-8 top-8 font-display text-[14px] font-medium uppercase tracking-[0.2em] text-base-600">
        Этаж {apt.floor} · Секция {apt.sectionNumber}
      </div>
    </StageBox>
  );
}

function GenplanView({ apt }: { apt: Apartment }) {
  // Mini-genplan focused on this apartment's section only — every other
  // section's outline + chip is filtered out via isSectionVisible. With
  // staticOverlay the polygon paints in the «active» (blue fill) state
  // without reacting to hover or clicks: it's a context preview, not a
  // navigator.
  return (
    <StageBox>
      <GenplanCanvas
        showOverlays
        staticOverlay
        chipScale={1.6}
        activeSection={apt.sectionNumber}
        isSectionVisible={(n) => n === apt.sectionNumber}
      />
    </StageBox>
  );
}

function OfferCard({
  icon,
  title,
  note,
}: {
  icon: React.ReactNode;
  title: string;
  note: string;
}) {
  return (
    <Pressable
      rippleColor="rgba(255,255,255,0.18)"
      className="flex aspect-[3/4] w-full flex-col items-start justify-between bg-base-0/[0.04] p-4 text-left text-base-0"
    >
      <div className="rounded-full bg-base-0/10 p-2">{icon}</div>
      <div>
        <p className="font-display text-[14px] font-semibold leading-tight">{title}</p>
        <p className="mt-1 font-sans text-[12px] text-base-0/55">{note}</p>
      </div>
    </Pressable>
  );
}
