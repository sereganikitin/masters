import { useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { OverlayChrome } from "@/components/OverlayChrome";
import { RoomFilter } from "@/components/RoomFilter";
import { Reveal } from "@/components/Reveal";
import { Pressable } from "@/components/Pressable";
import { PlanImage } from "@/components/PlanImage";
import { OverlayLayer } from "@/components/OverlayLayer";
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

  return (
    <div className="relative h-full w-full bg-base-100">
      <OverlayChrome onBack={() => nav(`/section/${num}`)} backLabel={`Секция ${num}`} />

      {/* Header */}
      <div className="absolute left-10 right-10 top-10 z-10 flex items-end justify-between pl-44">
        <div>
          <Reveal mode="up">
            <p className="font-sans text-upper uppercase tracking-[0.25em] text-base-600">
              Секция {num} · Этаж {floorNum}
            </p>
          </Reveal>
          <Reveal mode="up" delay={100}>
            <h2 className="mt-2 font-display text-[48px] font-semibold leading-none text-base-800">
              {apartments.length} квартир на этаже
            </h2>
          </Reveal>
        </div>
        <Reveal mode="up" delay={200}>
          <RoomFilter value={filter} onChange={setFilter} />
        </Reveal>
      </div>

      {/* Floor plan banner with admin-drawn lot overlays */}
      <Reveal
        mode="up"
        delay={150}
        className="absolute inset-x-10 top-[180px] z-10"
      >
        <div className="relative h-[160px] overflow-hidden bg-base-0 shadow-card">
          <div className="grid h-full w-full place-items-center">
            <PlanImage
              src={floorPlanUrl(num, floorNum)}
              alt={`План этажа ${floorNum}`}
              className="max-h-full max-w-full object-contain"
              fallback={
                <span className="font-sans text-small uppercase tracking-[0.2em] text-base-600">
                  План этажа {floorNum} · Изображение не загрузилось
                </span>
              }
            />
          </div>
          {/* Overlays — clickable lot polygons drawn in admin. entityId = apartment.id from feed */}
          <OverlayLayer
            scope="floor"
            scopeKey={`${num}_${floorNum}`}
            onPick={(o) => nav(`/apartment/${o.entityId}`)}
          />
        </div>
      </Reveal>

      {/* Apartments grid */}
      <div className="absolute inset-x-10 bottom-10 top-[360px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="grid place-items-center py-20 font-sans text-h5 text-base-600">
            Нет квартир с выбранным типом на этом этаже
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5 pr-1">
            {filtered.map((apt, i) => (
              <Reveal key={apt.id} mode="up" delay={(i % 6) * 70}>
                <Pressable
                  onClick={() => nav(`/apartment/${apt.id}`)}
                  rippleColor="rgba(0,97,166,0.1)"
                  className="group flex w-full flex-col items-stretch bg-base-0 p-6 text-left shadow-card"
                >
                  <div className="relative w-full overflow-hidden bg-base-100" style={{ aspectRatio: "4 / 3" }}>
                    <PlanImage
                      src={apartmentPlanUrl(apt)}
                      alt=""
                      className="absolute inset-0 h-full w-full object-contain p-3"
                      fallback={
                        <div className="grid h-full w-full place-items-center">
                          <span className="font-display text-small font-semibold text-base-600">
                            План №{apt.number}
                          </span>
                        </div>
                      }
                    />
                  </div>

                  <div className="mt-5 flex items-baseline justify-between">
                    <span className="font-display text-[28px] font-semibold leading-none text-base-800">
                      №{apt.number}
                    </span>
                    <span className="bg-base-100 px-3 py-1 font-sans text-small font-medium text-base-700">
                      {roomTypeLabel(apt.roomType)}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-y-2 font-sans text-small">
                    <span className="text-base-600">Площадь</span>
                    <span className="text-right font-medium text-base-800">
                      {formatArea(apt.area)}
                    </span>
                    <span className="text-base-600">Жилая</span>
                    <span className="text-right font-medium text-base-800">
                      {formatArea(apt.livingArea)}
                    </span>
                    <span className="text-base-600">Этаж</span>
                    <span className="text-right font-medium text-base-800">{apt.floor}</span>
                    <span className="text-base-600">Цена за м²</span>
                    <span className="text-right font-medium text-base-800">
                      {formatPrice(apt.pricePerMeter)}
                    </span>
                  </div>

                  <div className="mt-6 border-t border-base-200 pt-4 font-sans">
                    <div className="flex items-baseline justify-between">
                      <span className="text-small text-base-600">Стоимость</span>
                      <span className="font-display text-h4 font-semibold text-accent">
                        {formatPrice(apt.price)}
                      </span>
                    </div>
                  </div>
                </Pressable>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
