import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
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
  excludeFirstFloor: boolean;
  excludeLastFloor: boolean;
  /** Selected decoration chip keys (multi-select). */
  decoration: Set<string>;
  /** Stand-in for «Со скидкой»; no data backing yet, kept as a no-op chip. */
  discount: boolean;
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
    excludeFirstFloor: false,
    excludeLastFloor: false,
    decoration: new Set(),
    discount: false,
    perks: new Set(),
  };
}

/** Per-section top floor — used by the «Не последний» filter. */
function sectionTopFloors(): Record<number, number> {
  const map: Record<number, number> = {};
  getHouse().sections.forEach((s) => {
    map[s.number] = s.highFloor ?? 0;
  });
  return map;
}

// Decoration chip catalogue. Each chip matches one or more strings in the live
// `apartment.decoration` field; chips with no matches still render so the UI
// is forward-compatible with future feed data.
const DECORATION_CHIPS: { key: string; label: string; match: RegExp }[] = [
  { key: "white-box", label: "White Box", match: /white\s*box/i },
  { key: "raw", label: "Без отделки", match: /без отделки/i },
  { key: "pre-clean", label: "Предчистовая отделка", match: /предчистов/i },
];

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
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Pre-fill from URL — when arriving from /genplan.
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

  const topFloors = useMemo(() => sectionTopFloors(), []);

  const filtered = useMemo(() => {
    const list = allApartments.filter((a) => {
      if (filters.room.size > 0 && !filters.room.has(a.roomType)) return false;
      if (filters.sections.size > 0 && !filters.sections.has(a.sectionNumber))
        return false;
      if (a.price < filters.minPrice || a.price > filters.maxPrice) return false;
      if (a.area < filters.minArea || a.area > filters.maxArea) return false;
      if (a.floor < filters.minFloor || a.floor > filters.maxFloor) return false;
      if (filters.excludeFirstFloor && a.floor === 1) return false;
      if (filters.excludeLastFloor && a.floor === topFloors[a.sectionNumber])
        return false;
      if (filters.decoration.size > 0) {
        const matches = DECORATION_CHIPS.filter((c) =>
          filters.decoration.has(c.key),
        ).some((c) => c.match.test(a.decoration ?? ""));
        if (!matches) return false;
      }
      if (filters.perks.has("cornerGlazing") && !a.features.cornerGlazing) return false;
      if (
        filters.perks.has("largeKitchenLivingRoom") &&
        !a.features.largeKitchenLivingRoom
      )
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
  }, [allApartments, filters, sort, topFloors]);

  const reset = () => setFilters(bounds);

  const activeChips = buildActiveChips(filters, bounds, setFilters);
  const anyFilterActive = activeChips.length > 0;

  const paramSummary = (() => {
    const parts: string[] = [];
    if (filters.room.size > 0) {
      parts.push(Array.from(filters.room).map(roomTypeLabel).join(", "));
    }
    if (
      filters.minArea > bounds.minArea ||
      filters.maxArea < bounds.maxArea
    ) {
      parts.push(`${formatArea(filters.minArea)}–${formatArea(filters.maxArea)}`);
    }
    if (
      filters.minFloor > bounds.minFloor ||
      filters.maxFloor < bounds.maxFloor
    ) {
      parts.push(`этаж ${filters.minFloor}–${filters.maxFloor}`);
    }
    if (filters.excludeFirstFloor) parts.push("не первый");
    if (filters.excludeLastFloor) parts.push("не последний");
    return parts.length === 0 ? "Все" : parts.join(" · ");
  })();

  return (
    <div className="relative h-full w-full overflow-hidden bg-base-0 text-base-800">
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

          {/* Top row — 3 columns (Параметры / Стоимость / Срок сдачи) */}
          <div className="mt-10 grid grid-cols-3 gap-5">
            <ParamsDropdown
              label="Параметры квартиры"
              value={paramSummary}
              filters={filters}
              bounds={bounds}
              setFilters={setFilters}
            />

            <PriceSliderCard
              label="Стоимость, млн ₽"
              min={bounds.minPrice}
              max={bounds.maxPrice}
              value={[filters.minPrice, filters.maxPrice]}
              onChange={([lo, hi]) =>
                setFilters((f) => ({ ...f, minPrice: lo, maxPrice: hi }))
              }
            />

            <DropdownPlaceholder label="Срок сдачи" value="Любой" />
          </div>

          {/* Second row — quick chips + «Все фильтры» button */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <DiscountChip
              active={filters.discount}
              onClick={() => setFilters((f) => ({ ...f, discount: !f.discount }))}
            />
            {DECORATION_CHIPS.map((c) => {
              const active = filters.decoration.has(c.key);
              return (
                <QuickChip
                  key={c.key}
                  active={active}
                  onClick={() =>
                    setFilters((f) => {
                      const next = new Set(f.decoration);
                      active ? next.delete(c.key) : next.add(c.key);
                      return { ...f, decoration: next };
                    })
                  }
                >
                  {c.label}
                </QuickChip>
              );
            })}
            <QuickChip
              active={filters.perks.has("masterBedroom")}
              onClick={() =>
                setFilters((f) => {
                  const next = new Set(f.perks);
                  next.has("masterBedroom")
                    ? next.delete("masterBedroom")
                    : next.add("masterBedroom");
                  return { ...f, perks: next };
                })
              }
            >
              Мастер-спальня
            </QuickChip>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="ml-auto flex h-12 items-center gap-2 bg-night-500 px-5 font-sans text-body font-medium text-base-0 transition-colors hover:bg-night-400"
            >
              <FiltersIcon />
              Все фильтры
            </button>
          </div>

          {/* Active filters + reset */}
          {anyFilterActive && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {activeChips.map((c) => (
                <RemovableChip key={c.key} onRemove={c.remove}>
                  {c.label}
                </RemovableChip>
              ))}
              <button
                type="button"
                onClick={reset}
                className="ml-auto flex h-10 items-center gap-2 border border-base-800/30 bg-base-0 px-4 font-sans text-small font-medium text-base-700 hover:bg-base-100"
              >
                <CrossIcon />
                Сбросить все
              </button>
            </div>
          )}
        </header>

        {/* ───────────── Sort + count ───────────── */}
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

        {/* ───────────── Cards ───────────── */}
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

      {drawerOpen && (
        <AllFiltersDrawer
          filters={filters}
          sections={house.sections.map((s) => s.number)}
          setFilters={setFilters}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// «Все фильтры» drawer — sections + area/floor sliders + remaining perks
// ─────────────────────────────────────────────────────────────────────────────

function AllFiltersDrawer({
  filters,
  sections,
  setFilters,
  onClose,
}: {
  filters: Filters;
  sections: number[];
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть фильтры"
        className="absolute inset-0 bg-black/40"
      />
      <aside className="absolute right-0 top-0 flex h-full w-[480px] flex-col bg-base-0 shadow-card">
        <header className="flex items-center justify-between border-b border-base-200 px-8 py-6">
          <h2 className="font-display text-h4 font-semibold text-base-800">
            Все фильтры
          </h2>
          <Pressable
            onClick={onClose}
            rippleColor="rgba(0,0,0,0.08)"
            className="grid h-12 w-12 place-items-center"
            aria-label="Закрыть"
          >
            <IconClose size={20} />
          </Pressable>
        </header>

        <div
          className="min-h-0 flex-1 space-y-8 overflow-y-auto p-8"
          style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
        >
          <DrawerGroup title="Секция">
            <div className="flex flex-wrap gap-2">
              {sections.map((n) => {
                const active = filters.sections.has(n);
                return (
                  <QuickChip
                    key={n}
                    active={active}
                    onClick={() =>
                      setFilters((f) => {
                        const next = new Set(f.sections);
                        active ? next.delete(n) : next.add(n);
                        return { ...f, sections: next };
                      })
                    }
                  >
                    С{n}
                  </QuickChip>
                );
              })}
            </div>
          </DrawerGroup>

          <DrawerGroup title="Особенности">
            <div className="flex flex-col gap-2">
              {(Object.keys(PERK_LABELS) as PerkKey[]).map((k) => {
                const active = filters.perks.has(k);
                return (
                  <QuickChip
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
                  </QuickChip>
                );
              })}
            </div>
          </DrawerGroup>
        </div>

        <footer className="border-t border-base-200 p-6">
          <Pressable
            onClick={onClose}
            rippleColor="rgba(255,255,255,0.25)"
            className="flex h-14 w-full items-center justify-center bg-accent font-sans text-body font-medium text-base-0"
          >
            Применить
          </Pressable>
        </footer>
      </aside>
    </div>
  );
}

function DrawerGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-sans text-upper uppercase tracking-[0.2em] text-base-600">
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter components
// ─────────────────────────────────────────────────────────────────────────────

function ParamsDropdown({
  label,
  value,
  filters,
  bounds,
  setFilters,
}: {
  label: string;
  value: string;
  filters: Filters;
  bounds: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  const toggleRoom = (rt: RoomType) =>
    setFilters((f) => {
      const next = new Set(f.room);
      next.has(rt) ? next.delete(rt) : next.add(rt);
      return { ...f, room: next };
    });

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-[72px] w-full items-center justify-between border border-base-800/30 bg-base-0 px-5 text-left transition-colors hover:border-base-300"
      >
        <div className="flex min-w-0 flex-col">
          <span className="font-sans text-[12px] text-base-600">{label}</span>
          <span className="mt-1 truncate font-sans text-body font-medium text-base-800">
            {value}
          </span>
        </div>
        <ChevronDown className={open ? "rotate-180" : ""} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 flex flex-col gap-6 border border-base-800/30 bg-base-0 p-5 shadow-card">
          <ParamsBlock title="Количество спален">
            <div className="grid grid-cols-4 gap-2">
              {ROOM_TYPES.filter((rt) => rt.key !== "studio").map((rt) => {
                const active = filters.room.has(rt.key);
                return (
                  <Pressable
                    key={rt.key}
                    onClick={() => toggleRoom(rt.key)}
                    rippleColor={
                      active ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.08)"
                    }
                    className={`flex h-12 items-center justify-center font-sans text-body font-medium transition-colors ${
                      active
                        ? "bg-night-500 text-base-0"
                        : "border border-base-800/30 bg-base-0 text-base-800"
                    }`}
                  >
                    {rt.label}
                  </Pressable>
                );
              })}
            </div>
          </ParamsBlock>

          <ParamsBlock title="Площадь, м²">
            <div className="border border-base-800/30 px-5 py-3">
              <div className="flex items-center justify-between font-sans text-body font-medium text-base-800">
                <span>от {formatArea(filters.minArea)}</span>
                <span>до {formatArea(filters.maxArea)}</span>
              </div>
              <RangeSlider
                hideValues
                min={bounds.minArea}
                max={bounds.maxArea}
                step={1}
                value={[filters.minArea, filters.maxArea]}
                format={(v) => formatArea(v)}
                onChange={([lo, hi]) =>
                  setFilters((f) => ({ ...f, minArea: lo, maxArea: hi }))
                }
              />
            </div>
          </ParamsBlock>

          <ParamsBlock title="Этаж">
            <div className="border border-base-800/30 px-5 py-3">
              <div className="flex items-center justify-between font-sans text-body font-medium text-base-800">
                <span>от {filters.minFloor}</span>
                <span>до {filters.maxFloor}</span>
              </div>
              <RangeSlider
                hideValues
                min={bounds.minFloor}
                max={bounds.maxFloor}
                step={1}
                value={[filters.minFloor, filters.maxFloor]}
                format={(v) => String(v)}
                onChange={([lo, hi]) =>
                  setFilters((f) => ({ ...f, minFloor: lo, maxFloor: hi }))
                }
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <QuickChip
                active={filters.excludeFirstFloor}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    excludeFirstFloor: !f.excludeFirstFloor,
                  }))
                }
              >
                Не первый
              </QuickChip>
              <QuickChip
                active={filters.excludeLastFloor}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    excludeLastFloor: !f.excludeLastFloor,
                  }))
                }
              >
                Не последний
              </QuickChip>
            </div>
          </ParamsBlock>
        </div>
      )}
    </div>
  );
}

function ParamsBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 font-sans text-small text-base-600">{title}</p>
      {children}
    </div>
  );
}

function DropdownPlaceholder({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  // Static placeholder — no data backing yet (e.g. «Срок сдачи»).
  return (
    <div className="flex h-[72px] w-full cursor-default items-center justify-between border border-base-800/30 bg-base-0 px-5 text-left">
      <div className="flex min-w-0 flex-col">
        <span className="font-sans text-[12px] text-base-600">{label}</span>
        <span className="mt-1 truncate font-sans text-body font-medium text-base-800">
          {value}
        </span>
      </div>
      <ChevronDown />
    </div>
  );
}

function PriceSliderCard({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const toMln = (v: number) =>
    (v / 1_000_000).toFixed(1).replace(".", ",");
  return (
    <div className="flex h-[72px] flex-col justify-center border border-base-800/30 bg-base-0 px-5">
      <span className="font-sans text-[12px] text-base-600">{label}</span>
      <RangeSlider
        min={min}
        max={max}
        step={100_000}
        value={value}
        onChange={onChange}
        format={toMln}
      />
    </div>
  );
}

function DiscountChip({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  // Always-blue brand chip. Toggle still flips a filter flag, but the
  // visual remains solid accent so it stands out as the promo CTA.
  // Slight dim when inactive so users still get feedback the toggle is off.
  return (
    <Pressable
      onClick={onClick}
      rippleColor="rgba(255,255,255,0.25)"
      className={`flex h-12 items-center gap-2 px-4 font-sans text-body font-medium text-base-0 transition-opacity ${
        active ? "bg-accent" : "bg-accent/85 hover:bg-accent"
      }`}
    >
      <LightningIcon />
      Со скидкой
    </Pressable>
  );
}

function QuickChip({
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
      className={`flex h-12 items-center px-4 font-sans text-body font-medium transition-colors ${
        active
          ? "bg-night-500 text-base-0"
          : "border border-base-800/30 bg-base-0 text-base-800"
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
      className="flex h-10 items-center gap-2 border border-base-800/30 bg-base-0 px-4 font-sans text-small font-medium text-base-700 hover:bg-base-100"
    >
      <CrossIcon />
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Active chip builder
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

  if (filters.excludeFirstFloor) {
    chips.push({
      key: "excludeFirstFloor",
      label: "Не первый этаж",
      remove: () => setFilters((f) => ({ ...f, excludeFirstFloor: false })),
    });
  }

  if (filters.excludeLastFloor) {
    chips.push({
      key: "excludeLastFloor",
      label: "Не последний этаж",
      remove: () => setFilters((f) => ({ ...f, excludeLastFloor: false })),
    });
  }

  filters.decoration.forEach((dKey) => {
    const chip = DECORATION_CHIPS.find((c) => c.key === dKey);
    if (!chip) return;
    chips.push({
      key: `decoration:${dKey}`,
      label: chip.label,
      remove: () =>
        setFilters((f) => {
          const next = new Set(f.decoration);
          next.delete(dKey);
          return { ...f, decoration: next };
        }),
    });
  });

  if (filters.discount) {
    chips.push({
      key: "discount",
      label: "Со скидкой",
      remove: () => setFilters((f) => ({ ...f, discount: false })),
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
// Apartment card
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
// Icons + tiny helpers
// ─────────────────────────────────────────────────────────────────────────────

function ChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="8"
      viewBox="0 0 14 8"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-base-600 transition-transform duration-150 ${className}`}
      aria-hidden
    >
      <path d="M1 1l6 6 6-6" />
    </svg>
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

function FiltersIcon() {
  return (
    <svg
      width="16"
      height="14"
      viewBox="0 0 16 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M1 3h10M13 3h2M1 11h2M5 11h10" />
      <circle cx="12" cy="3" r="1.5" fill="currentColor" />
      <circle cx="4" cy="11" r="1.5" fill="currentColor" />
    </svg>
  );
}

function LightningIcon() {
  return (
    <svg
      width="12"
      height="14"
      viewBox="0 0 12 14"
      fill="currentColor"
      aria-hidden
    >
      <path d="M7 0L0 8h4l-2 6 8-9H6L7 0z" />
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
    <label className="flex items-center gap-2 font-sans text-body font-medium text-base-800">
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
