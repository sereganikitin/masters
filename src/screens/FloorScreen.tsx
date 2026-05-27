import { useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { OverlayChrome } from "@/components/OverlayChrome";
import { RoomFilter } from "@/components/RoomFilter";
import { Reveal } from "@/components/Reveal";
import { Pressable } from "@/components/Pressable";
import { PlanImage } from "@/components/PlanImage";
import { OverlayLayer } from "@/components/OverlayLayer";
import { useOverlays } from "@/lib/useOverlays";
import { getSection, formatArea, formatPrice, roomTypeLabel } from "@/data/complex";
import { apartmentPlanUrl, floorPlanUrl } from "@/lib/plans";
import type { RoomType } from "@/data/types";

export function FloorScreen() {
  const { sectionNumber, floor } = useParams();
  const nav = useNavigate();
  const num = Number(sectionNumber);
  const floorNum = Number(floor);
  const section = getSection(num);
  const apartments = useMemo(
    () => section?.apartmentsByFloor[floorNum] ?? [],
    [section, floorNum],
  );
  const [filter, setFilter] = useState<RoomType | "all">("all");

  const filtered = useMemo(
    () => (filter === "all" ? apartments : apartments.filter((a) => a.roomType === filter)),
    [apartments, filter],
  );

  const { overlays: lotOverlays } = useOverlays("floor", section ? `${num}_${floorNum}` : "");
  const hasOverlays = lotOverlays.length > 0;

  // Floor list — ordered descending (top floor first) for the left rail.
  const floors = useMemo(() => {
    if (!section) return [];
    return Object.keys(section.apartmentsByFloor).map(Number).sort((a, b) => b - a);
  }, [section]);

  if (!section || apartments.length === 0) {
    return (
      <div className="grid h-full place-items-center bg-base-100">
        <div className="text-center">
          <p className="font-display text-h3">Этаж не найден</p>
          <Pressable
            onClick={() => nav(`/section/${num}`)}
            className="mt-6 bg-accent px-6 py-3 font-sans text-body text-base-0"
          >
            К секции
          </Pressable>
        </div>
      </div>
    );
  }

  // Lot overlay → enabled only when at least one apartment of the active filter
  // exists at the lot. Lot's entityId == apartment.id; we use that to lookup.
  const isLotEnabled = (o: { entityId: string }) => {
    if (filter === "all") return true;
    const apt = apartments.find((a) => a.id === o.entityId);
    return apt?.roomType === filter;
  };

  return (
    <div className="relative h-full w-full bg-base-100">
      <OverlayChrome onBack={() => nav(`/section/${num}`)} backLabel={`Секция ${num}`} />

      {/* Header — only kicker + title, no extra controls */}
      <div className="absolute left-44 right-10 top-10 z-10">
        <Reveal mode="up">
          <p className="font-sans text-upper uppercase tracking-[0.25em] text-base-600">
            Секция {num}
          </p>
        </Reveal>
        <Reveal mode="up" delay={80}>
          <h2 className="mt-2 font-display text-[32px] font-semibold uppercase leading-none tracking-[0.02em] text-base-800">
            {floorNum} этаж
          </h2>
        </Reveal>
      </div>

      {/* Left rail — vertical floor switcher per Figma 13558:78106.
        * Sharp square buttons 48×48, Imperial Night active, white+border inactive. */}
      <div className="absolute left-10 top-1/2 z-10 -translate-y-1/2">
        <Reveal mode="left">
          <p className="mb-3 font-sans text-upper uppercase tracking-[0.2em] text-base-600">
            Этажи
          </p>
        </Reveal>
        <div className="flex max-h-[640px] flex-col gap-1 overflow-y-auto pr-1">
          {floors.map((f, i) => {
            const isActive = f === floorNum;
            const aptCount = section.apartmentsByFloor[f].length;
            return (
              <Reveal key={f} mode="left" delay={Math.min(i * 24, 240)}>
                <Pressable
                  onClick={() => f !== floorNum && nav(`/floor/${num}/${f}`)}
                  rippleColor={
                    isActive ? "rgba(255,255,255,0.25)" : "rgba(0,97,166,0.12)"
                  }
                  className={`grid h-12 w-16 place-items-center font-sans text-body font-medium tabular-nums transition-colors ${
                    isActive
                      ? "bg-night-500 text-base-0"
                      : "border border-base-200 bg-base-0 text-base-800"
                  }`}
                  title={`${f} этаж · ${aptCount} кв.`}
                >
                  {f}
                </Pressable>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* Main canvas — floor plan with admin-drawn lot overlays */}
      <Reveal
        mode="fade"
        delay={120}
        className="absolute left-32 right-[420px] top-32 bottom-32"
      >
        <div className="relative h-full w-full overflow-hidden bg-base-0 shadow-card">
          <PlanImage
            src={floorPlanUrl(num, floorNum)}
            alt={`План этажа ${floorNum}`}
            className="absolute inset-0 h-full w-full object-contain p-8"
            fallback={
              <div className="grid h-full place-items-center font-sans text-h5 text-base-600">
                План этажа недоступен
              </div>
            }
          />
          <OverlayLayer
            scope="floor"
            scopeKey={`${num}_${floorNum}`}
            isEnabled={isLotEnabled}
            onPick={(o) => nav(`/apartment/${o.entityId}`)}
            showLabels={false}
          />
        </div>
      </Reveal>

      {/* Right panel — apartment list (compact fallback when no overlays drawn).
        * Acts as alternative way to pick a lot until admin draws polygons. */}
      <div className="absolute right-10 top-32 bottom-32 z-10 w-[380px] overflow-hidden bg-base-0 shadow-card">
        <div className="flex h-full flex-col">
          <div className="flex-shrink-0 border-b border-base-200 px-6 py-5">
            <p className="font-sans text-upper uppercase tracking-[0.25em] text-base-600">
              Квартиры на этаже
            </p>
            <p className="mt-1 font-display text-h5 font-semibold text-base-800">
              {filtered.length} {pluralize(filtered.length, ["лот", "лота", "лотов"])}
            </p>
            {hasOverlays && (
              <p className="mt-2 font-sans text-[11px] text-base-600">
                Можно тапнуть прямо по плану слева
              </p>
            )}
          </div>
          <div
            className="min-h-0 flex-1 overflow-y-auto"
            style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
          >
            {filtered.length === 0 ? (
              <div className="grid h-full place-items-center px-6 text-center font-sans text-body text-base-600">
                Нет квартир выбранного типа
              </div>
            ) : (
              <ul className="divide-y divide-base-200">
                {filtered.map((apt) => (
                  <li key={apt.id}>
                    <Pressable
                      onClick={() => nav(`/apartment/${apt.id}`)}
                      rippleColor="rgba(0,97,166,0.1)"
                      className="grid w-full grid-cols-[64px_1fr_auto] items-center gap-3 px-6 py-4 text-left"
                    >
                      <div className="relative h-14 w-14 overflow-hidden bg-base-100">
                        <PlanImage
                          src={apartmentPlanUrl(apt)}
                          alt=""
                          className="absolute inset-0 h-full w-full object-contain p-1"
                          fallback={
                            <div className="grid h-full place-items-center font-sans text-[10px] text-base-600">
                              №{apt.number}
                            </div>
                          }
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-[16px] font-semibold text-base-800">
                          №{apt.number} · {roomTypeLabel(apt.roomType)}
                        </div>
                        <div className="mt-0.5 font-sans text-[12px] text-base-600">
                          {formatArea(apt.area)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-[14px] font-semibold text-base-800">
                          {formatPrice(apt.price)}
                        </div>
                      </div>
                    </Pressable>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Room filter (bottom-left) */}
      <RoomFilter
        value={filter}
        onChange={setFilter}
        className="absolute bottom-10 left-32 z-10"
      />
    </div>
  );
}

function pluralize(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}
