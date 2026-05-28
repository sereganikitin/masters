import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Pressable } from "@/components/Pressable";
import { Reveal } from "@/components/Reveal";
import { PlanImage } from "@/components/PlanImage";
import { RangeSlider } from "@/components/RangeSlider";
import { IconClose } from "@/components/Icon";
import {
  getHouse,
  formatArea,
  formatPrice,
  roomTypeLabel,
  ROOM_TYPES,
} from "@/data/complex";
import { apartmentPlanUrl } from "@/lib/plans";
import type { Apartment, RoomType } from "@/data/types";

type SortKey =
  | "price-asc"
  | "price-desc"
  | "area-asc"
  | "area-desc"
  | "floor-asc"
  | "floor-desc";

type PerkKey = "cornerGlazing" | "largeKitchenLivingRoom" | "masterBedroom";

interface Filters {
  room: Set<RoomType>;
  sections: Set<number>;
  minPrice: number;
  maxPrice: number;
  minArea: number;
  maxArea: number;
  minFloor: number;
  maxFloor: number;
  decoration: "any" | "raw" | "finished";
  perks: Set<PerkKey>;
}

function getDefaultFilters(all: Apartment[]): Filters {
  const prices = all.map((a) => a.price);
  const areas = all.map((a) => a.area);
  const floors = all.map((a) => a.floor);
  return {
    room: new Set(),
    sections: new Set(),
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    minArea: Math.min(...areas),
    maxArea: Math.max(...areas),
    minFloor: Math.min(...floors),
    maxFloor: Math.max(...floors),
    decoration: "any",
    perks: new Set(),
  };
}

const PERK_LABELS: Record<PerkKey, string> = {
  cornerGlazing: "Угловое остекление",
  largeKitchenLivingRoom: "Кухня-гостиная",
  masterBedroom: "Мастер-спальня",
};

export function CatalogScreen() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const house = getHouse();
  const allApartments = useMemo<Apartment[]>(
    () => house.sections.flatMap((s) => Object.values(s.apartmentsByFloor).flat()),
    [house],
  );

  const bounds = useMemo(() => getDefaultFilters(allApartments), [allApartments]);
  const [filters, setFilters] = useState<Filters>(bounds);
  const [sort, setSort] = useState<SortKey>("price-asc");

  // Apply URL filters on mount — when arriving from /genplan:
  //   ?section=2          — single or comma-separated section numbers
  //   ?rooms=1,2,studio   — comma-separated room types
  //   ?floor=2-15         — floor range (inclusive)
  useEffect(() => {
    setFilters((f) => {
      const next = { ...f };

      const rawSection = searchParams.get("section");
      if (rawSection) {
        const nums = rawSection
          .split(",")
          .map((s) => Number(s.trim()))
          .filter((n) => Number.isFinite(n) && n > 0);
        if (nums.length > 0) next.sections = new Set(nums);
      }

      const rawRooms = searchParams.get("rooms");
      if (rawRooms) {
        const allowed = new Set(["studio", "1", "2", "3", "4+"]);
        const list = rawRooms
          .split(",")
          .map((s) => s.trim())
          .filter((s) => allowed.has(s)) as RoomType[];
        if (list.length > 0) next.room = new Set(list);
      }

      const rawFloor = searchParams.get("floor");
      if (rawFloor) {
        const m = rawFloor.match(/^(\d+)\s*-\s*(\d+)$/);
        if (m) {
          const lo = Math.max(bounds.minFloor, Number(m[1]));
          const hi = Math.min(bounds.maxFloor, Number(m[2]));
          if (lo <= hi) {
            next.minFloor = lo;
            next.maxFloor = hi;
          }
        }
      }

      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const list = allApartments.filter((a) => {
      if (filters.room.size > 0 && !filters.room.has(a.roomType)) return false;
      if (filters.sections.size > 0 && !filters.sections.has(a.sectionNumber)) return false;
      if (a.price < filters.minPrice || a.price > filters.maxPrice) return false;
      if (a.area < filters.minArea || a.area > filters.maxArea) return false;
      if (a.floor < filters.minFloor || a.floor > filters.maxFloor) return false;
      if (filters.decoration === "raw" && !a.decoration.toLowerCase().includes("без"))
        return false;
      if (filters.decoration === "finished" && a.decoration.toLowerCase().includes("без"))
        return false;
      if (filters.perks.has("cornerGlazing") && !a.features.cornerGlazing) return false;
      if (filters.perks.has("largeKitchenLivingRoom") && !a.features.largeKitchenLivingRoom)
        return false;
      if (filters.perks.has("masterBedroom") && !a.features.masterBedroom) return false;
      return true;
    });

    const cmp: Record<SortKey, (a: Apartment, b: Apartment) => number> = {
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      "area-asc": (a, b) => a.area - b.area,
      "area-desc": (a, b) => b.area - a.area,
      "floor-asc": (a, b) => a.floor - b.floor,
      "floor-desc": (a, b) => b.floor - a.floor,
    };
    return [...list].sort(cmp[sort]);
  }, [allApartments, filters, sort]);

  const reset = () => setFilters(bounds);

  // Build a list of "active filter" chips that the user can remove individually.
  const activeChips = buildActiveChips(filters, bounds, setFilters);
  const anyFilterActive = activeChips.length > 0;

  return (
    <div className="relative h-full w-full overflow-hidden bg-base-0 text-base-800">
      {/* Close button — global, always visible */}
      <Pressable
        onClick={() => {
          if (window.history.length > 1) nav(-1);
          else nav("/");
        }}
        rippleColor="rgba(0,0,0,0.12)"
        className="absolute right-9 top-9 z-50 grid h-14 w-14 place-items-center rounded-full bg-base-0 text-base-800 shadow-card"
        aria-label="Закрыть"
      >
        <IconClose size={22} />
      </Pressable>

      <div
        className="h-full w-full overflow-y-auto"
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
      >
        {/* ───────────── Title + filter bar ───────────── */}
        <header className="px-12 pb-8 pt-12">
          <h1 className="font-display text-[64px] font-semibold uppercase leading-[1.1] tracking-[-0.02em] text-base-800">
            Квартиры
          </h1>

          <div className="mt-10 grid grid-cols-3 gap-8">
            <FilterColumn title="Параметры квартиры">
              <ChipRow>
                {ROOM_TYPES.map((rt) => {
                  const active = filters.room.has(rt.key);
                  return (
                    <Chip
                      key={rt.key}
                      active={active}
                      onClick={() =>
                        setFilters((f) => {
                          const next = new Set(f.room);
                          active ? next.delete(rt.key) : next.add(rt.key);
                          return { ...f, room: next };
                        })
                      }
                    >
                      {rt.label}
                    </Chip>
                  );
                })}
              </ChipRow>
            </FilterColumn>

            <FilterColumn title="Стоимость, ₽">
              <RangeSlider
                min={bounds.minPrice}
                max={bounds.maxPrice}
                value={[filters.minPrice, filters.maxPrice]}
                step={100_000}
                format={(v) => formatPrice(v)}
                onChange={([lo, hi]) =>
                  setFilters((f) => ({ ...f, minPrice: lo, maxPrice: hi }))
                }
              />
            </FilterColumn>

            <FilterColumn title="Площадь, м²">
              <RangeSlider
                min={bounds.minArea}
                max={bounds.maxArea}
                value={[filters.minArea, filters.maxArea]}
                step={1}
                format={(v) => formatArea(v)}
                onChange={([lo, hi]) =>
                  setFilters((f) => ({ ...f, minArea: lo, maxArea: hi }))
                }
              />
            </FilterColumn>
          </div>

          <div className="mt-8 grid grid-cols-[1fr_1fr] gap-8">
            <FilterColumn title="Секция">
              <ChipRow>
                {house.sections.map((s) => {
                  const active = filters.sections.has(s.number);
                  return (
                    <Chip
                      key={s.id}
                      active={active}
                      onClick={() =>
                        setFilters((f) => {
                          const next = new Set(f.sections);
                          active ? next.delete(s.number) : next.add(s.number);
                          return { ...f, sections: next };
                        })
                      }
                    >
                      С{s.number}
                    </Chip>
                  );
                })}
              </ChipRow>
            </FilterColumn>

            <FilterColumn title="Этаж">
              <RangeSlider
                min={bounds.minFloor}
                max={bounds.maxFloor}
                value={[filters.minFloor, filters.maxFloor]}
                step={1}
                format={(v) => String(v)}
                onChange={([lo, hi]) =>
                  setFilters((f) => ({ ...f, minFloor: lo, maxFloor: hi }))
                }
              />
            </FilterColumn>
          </div>

          {/* Perk + decoration quick-filter chips */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {(
              [
                ["any", "Любая отделка"],
                ["raw", "Без отделки"],
                ["finished", "С отделкой"],
              ] as const
            ).map(([k, label]) => (
              <Chip
                key={k}
                active={filters.decoration === k}
                onClick={() => setFilters((f) => ({ ...f, decoration: k }))}
              >
                {label}
              </Chip>
            ))}
            <span className="mx-2 inline-block h-6 w-px bg-base-200" aria-hidden />
            {(Object.keys(PERK_LABELS) as PerkKey[]).map((k) => {
              const active = filters.perks.has(k);
              return (
                <Chip
                  key={k}
                  active={active}
                  onClick={() =>
                    setFilters((f) => {
                      const next = new Set(f.perks);
                      active ? next.delete(k) : next.add(k);
                      return { ...f, perks: next };
                    })
                  }
                >
                  {PERK_LABELS[k]}
                </Chip>
              );
            })}
          </div>

          {/* Active filters row + reset */}
          {anyFilterActive && (
            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-base-200 pt-6">
              {activeChips.map((c) => (
                <RemovableChip key={c.key} onRemove={c.remove}>
                  {c.label}
                </RemovableChip>
              ))}
              <button
                type="button"
                onClick={reset}
                className="ml-auto flex h-10 items-center gap-2 border border-base-200 bg-base-0 px-4 font-sans text-small font-medium text-base-700 hover:bg-base-100"
              >
                <CrossIcon />
                Сбросить все
              </button>
            </div>
          )}
        </header>

        {/* ───────────── Sort + count gray bar ───────────── */}
        <div className="flex items-center justify-between border-y border-base-200 bg-base-100 px-12 py-5">
          <SortSelect value={sort} onChange={setSort} />
          <span className="font-sans text-body text-base-700">
            Найдено{" "}
            <span className="font-medium tabular-nums text-base-800">
              {filtered.length}
            </span>{" "}
            {pluralize(filtered.length, ["квартира", "квартиры", "квартир"])}
          </span>
        </div>

        {/* ───────────── Cards grid ───────────── */}
        <main className="px-12 pb-16 pt-8">
          {filtered.length === 0 ? (
            <div className="grid place-items-center py-20 text-center">
              <div>
                <p className="font-display text-h3 text-base-800">
                  Ничего не найдено
                </p>
                <p className="mt-3 font-sans text-body text-base-600">
                  Попробуйте смягчить фильтры
                </p>
                <Pressable
                  onClick={reset}
                  rippleColor="rgba(0,0,0,0.08)"
                  className="mt-6 h-12 bg-accent px-8 font-sans text-body font-medium text-base-0"
                >
                  Сбросить
                </Pressable>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-5">
              {filtered.map((apt, i) => (
                <Reveal key={apt.id} mode="up" delay={(i % 6) * 60} className="h-full">
                  <ApartmentCard
                    apt={apt}
                    onClick={() => nav(`/apartment/${apt.id}`)}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Active filter chip builder
// ─────────────────────────────────────────────────────────────────────────────

interface ActiveChip {
  key: string;
  label: string;
  remove: () => void;
}

function buildActiveChips(
  filters: Filters,
  bounds: Filters,
  setFilters: React.Dispatch<React.SetStateAction<Filters>>,
): ActiveChip[] {
  const chips: ActiveChip[] = [];

  filters.room.forEach((rt) =>
    chips.push({
      key: `room:${rt}`,
      label: roomTypeLabel(rt),
      remove: () =>
        setFilters((f) => {
          const next = new Set(f.room);
          next.delete(rt);
          return { ...f, room: next };
        }),
    }),
  );

  filters.sections.forEach((n) =>
    chips.push({
      key: `section:${n}`,
      label: `С${n}`,
      remove: () =>
        setFilters((f) => {
          const next = new Set(f.sections);
          next.delete(n);
          return { ...f, sections: next };
        }),
    }),
  );

  if (filters.minPrice > bounds.minPrice || filters.maxPrice < bounds.maxPrice) {
    chips.push({
      key: "price",
      label: `${formatPrice(filters.minPrice)} – ${formatPrice(filters.maxPrice)}`,
      remove: () =>
        setFilters((f) => ({
          ...f,
          minPrice: bounds.minPrice,
          maxPrice: bounds.maxPrice,
        })),
    });
  }

  if (filters.minArea > bounds.minArea || filters.maxArea < bounds.maxArea) {
    chips.push({
      key: "area",
      label: `${formatArea(filters.minArea)} – ${formatArea(filters.maxArea)}`,
      remove: () =>
        setFilters((f) => ({
          ...f,
          minArea: bounds.minArea,
          maxArea: bounds.maxArea,
        })),
    });
  }

  if (filters.minFloor > bounds.minFloor || filters.maxFloor < bounds.maxFloor) {
    chips.push({
      key: "floor",
      label: `Этаж ${filters.minFloor}–${filters.maxFloor}`,
      remove: () =>
        setFilters((f) => ({
          ...f,
          minFloor: bounds.minFloor,
          maxFloor: bounds.maxFloor,
        })),
    });
  }

  if (filters.decoration !== "any") {
    chips.push({
      key: "decoration",
      label: filters.decoration === "raw" ? "Без отделки" : "С отделкой",
      remove: () => setFilters((f) => ({ ...f, decoration: "any" })),
    });
  }

  filters.perks.forEach((p) =>
    chips.push({
      key: `perk:${p}`,
      label: PERK_LABELS[p],
      remove: () =>
        setFilters((f) => {
          const next = new Set(f.perks);
          next.delete(p);
          return { ...f, perks: next };
        }),
    }),
  );

  return chips;
}

// ─────────────────────────────────────────────────────────────────────────────
// Apartment card (unchanged from previous design)
// ─────────────────────────────────────────────────────────────────────────────

function ApartmentCard({ apt, onClick }: { apt: Apartment; onClick: () => void }) {
  const tags: string[] = [];
  if (apt.decoration) tags.push(apt.decoration);
  if (apt.features.largeKitchenLivingRoom) tags.push("Кухня-гостиная");
  if (apt.features.masterBedroom) tags.push("Мастер-спальня");
  if (apt.features.cornerGlazing) tags.push("Угловое остекление");
  return (
    <Pressable
      onClick={onClick}
      rippleColor="rgba(0,97,166,0.1)"
      className="flex h-full w-full flex-col bg-base-0 p-6 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      <div
        className="relative w-full overflow-hidden bg-base-100"
        style={{ aspectRatio: "4 / 3" }}
      >
        <PlanImage
          src={apartmentPlanUrl(apt)}
          alt=""
          className="absolute inset-0 h-full w-full object-contain p-4"
          fallback={
            <div className="grid h-full w-full place-items-center">
              <span className="font-display text-h5 font-semibold text-base-600">
                План №{apt.number}
              </span>
            </div>
          }
        />
      </div>

      {tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="bg-base-100 px-2.5 py-1 font-sans text-[12px] font-medium text-base-700"
            >
              {t}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="bg-base-100 px-2.5 py-1 font-sans text-[12px] font-medium text-base-700">
              +{tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 font-sans text-small font-medium uppercase tracking-wide text-base-600">
        {roomTypeLabel(apt.roomType)} · {formatArea(apt.area)}
      </div>

      <div className="mt-1 font-display text-[28px] font-semibold leading-none tracking-tight text-base-800">
        {formatPrice(apt.price)}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-y-1.5 border-t border-base-200 pt-4 font-sans text-small">
        <span className="text-base-600">Секция</span>
        <span className="text-right font-medium text-base-800">{apt.sectionNumber}</span>
        <span className="text-base-600">Этаж</span>
        <span className="text-right font-medium text-base-800">{apt.floor}</span>
        <span className="text-base-600">Цена за м²</span>
        <span className="text-right font-medium text-base-800">
          {formatPrice(apt.pricePerMeter)}
        </span>
      </div>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter primitives
// ─────────────────────────────────────────────────────────────────────────────

function FilterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <p className="font-sans text-small text-base-600">{title}</p>
      <div className="mt-3 flex-1">{children}</div>
    </div>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onClick={onClick}
      rippleColor={active ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.08)"}
      className={`flex h-10 items-center px-4 font-sans text-body font-medium transition-colors ${
        active
          ? "bg-night-500 text-base-0"
          : "border border-base-200 bg-base-0 text-base-800"
      }`}
    >
      {children}
    </Pressable>
  );
}

function RemovableChip({
  onRemove,
  children,
}: {
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="flex h-10 items-center gap-2 border border-base-200 bg-base-0 px-4 font-sans text-small font-medium text-base-700 hover:bg-base-100"
    >
      <CrossIcon />
      {children}
    </button>
  );
}

function CrossIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M2 2l8 8M10 2l-8 8" />
    </svg>
  );
}

function SortSelect({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (k: SortKey) => void;
}) {
  const options: { k: SortKey; label: string }[] = [
    { k: "price-asc", label: "Сначала дешевле" },
    { k: "price-desc", label: "Сначала дороже" },
    { k: "area-asc", label: "Меньше площадь" },
    { k: "area-desc", label: "Больше площадь" },
    { k: "floor-asc", label: "Ниже этаж" },
    { k: "floor-desc", label: "Выше этаж" },
  ];
  return (
    <label className="flex items-center gap-3 font-sans text-body font-medium text-base-800">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="cursor-pointer bg-transparent font-medium outline-none"
      >
        {options.map((o) => (
          <option key={o.k} value={o.k}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function pluralize(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}
