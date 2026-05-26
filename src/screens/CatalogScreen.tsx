import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Pressable } from "@/components/Pressable";
import { Reveal } from "@/components/Reveal";
import { PlanImage } from "@/components/PlanImage";
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

type SortKey = "price-asc" | "price-desc" | "area-asc" | "area-desc" | "floor-asc" | "floor-desc";

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
  perks: Set<"cornerGlazing" | "largeKitchenLivingRoom" | "masterBedroom">;
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

export function CatalogScreen() {
  const nav = useNavigate();
  const house = getHouse();
  const allApartments = useMemo<Apartment[]>(
    () => house.sections.flatMap((s) => Object.values(s.apartmentsByFloor).flat()),
    [house],
  );

  const bounds = useMemo(() => getDefaultFilters(allApartments), [allApartments]);
  const [filters, setFilters] = useState<Filters>(bounds);
  const [sort, setSort] = useState<SortKey>("price-asc");

  const filtered = useMemo(() => {
    let list = allApartments.filter((a) => {
      if (filters.room.size > 0 && !filters.room.has(a.roomType)) return false;
      if (filters.sections.size > 0 && !filters.sections.has(a.sectionNumber)) return false;
      if (a.price < filters.minPrice || a.price > filters.maxPrice) return false;
      if (a.area < filters.minArea || a.area > filters.maxArea) return false;
      if (a.floor < filters.minFloor || a.floor > filters.maxFloor) return false;
      if (filters.decoration === "raw" && !a.decoration.toLowerCase().includes("без")) return false;
      if (filters.decoration === "finished" && a.decoration.toLowerCase().includes("без")) return false;
      if (filters.perks.has("cornerGlazing") && !a.features.cornerGlazing) return false;
      if (filters.perks.has("largeKitchenLivingRoom") && !a.features.largeKitchenLivingRoom) return false;
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

  return (
    <div className="relative h-full w-full bg-base-100 text-base-800">
      {/* Close */}
      <Pressable
        onClick={() => nav("/")}
        rippleColor="rgba(0,0,0,0.12)"
        className="absolute right-9 top-9 z-50 grid h-14 w-14 place-items-center rounded-full bg-base-0 text-base-800 shadow-card"
        aria-label="Закрыть"
      >
        <IconClose size={22} />
      </Pressable>

      <div className="grid h-full w-full grid-cols-[400px_1fr]">
        {/* Sidebar */}
        <aside className="flex h-full min-h-0 flex-col border-r border-base-200 bg-base-0">
          <div className="flex-shrink-0 px-8 pb-6 pt-10">
            <p className="font-sans text-upper uppercase tracking-[0.3em] text-base-600">
              Каталог квартир
            </p>
            <h1 className="mt-2 font-display text-[34px] font-semibold leading-none tracking-tight">
              ЖК МАСТЕРС
            </h1>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto px-8 pb-8"
            style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
          >
            <FilterGroup title="Тип квартиры">
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
            </FilterGroup>

            <FilterGroup title="Стоимость, ₽">
              <RangeInputs
                min={bounds.minPrice}
                max={bounds.maxPrice}
                value={[filters.minPrice, filters.maxPrice]}
                step={100_000}
                format={(v) => formatPrice(v)}
                onChange={([lo, hi]) =>
                  setFilters((f) => ({ ...f, minPrice: lo, maxPrice: hi }))
                }
              />
            </FilterGroup>

            <FilterGroup title="Площадь, м²">
              <RangeInputs
                min={bounds.minArea}
                max={bounds.maxArea}
                value={[filters.minArea, filters.maxArea]}
                step={1}
                format={(v) => formatArea(v)}
                onChange={([lo, hi]) =>
                  setFilters((f) => ({ ...f, minArea: lo, maxArea: hi }))
                }
              />
            </FilterGroup>

            <FilterGroup title="Этаж">
              <RangeInputs
                min={bounds.minFloor}
                max={bounds.maxFloor}
                value={[filters.minFloor, filters.maxFloor]}
                step={1}
                format={(v) => String(v)}
                onChange={([lo, hi]) =>
                  setFilters((f) => ({ ...f, minFloor: lo, maxFloor: hi }))
                }
              />
            </FilterGroup>

            <FilterGroup title="Секция">
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
            </FilterGroup>

            <FilterGroup title="Отделка">
              <ChipRow>
                {(
                  [
                    ["any", "Любая"],
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
              </ChipRow>
            </FilterGroup>

            <FilterGroup title="Особенности">
              <div className="flex flex-col gap-3">
                {(
                  [
                    ["cornerGlazing", "Угловое остекление"],
                    ["largeKitchenLivingRoom", "Кухня-гостиная"],
                    ["masterBedroom", "Мастер-спальня"],
                  ] as const
                ).map(([k, label]) => (
                  <CheckboxRow
                    key={k}
                    checked={filters.perks.has(k)}
                    onChange={(v) =>
                      setFilters((f) => {
                        const next = new Set(f.perks);
                        v ? next.add(k) : next.delete(k);
                        return { ...f, perks: next };
                      })
                    }
                  >
                    {label}
                  </CheckboxRow>
                ))}
              </div>
            </FilterGroup>
          </div>

          <div className="border-t border-base-200 px-8 py-6">
            <Pressable
              onClick={reset}
              rippleColor="rgba(0,0,0,0.08)"
              className="h-12 w-full border border-base-200 bg-base-0 font-sans text-body font-medium text-base-800"
            >
              Сбросить фильтры
            </Pressable>
          </div>
        </aside>

        {/* Results */}
        <main className="flex h-full min-h-0 flex-col">
          <div className="flex flex-shrink-0 items-center justify-between border-b border-base-200 bg-base-0 px-12 py-6 pr-28">
            <div className="font-sans">
              <span className="font-display text-h4 font-semibold tabular-nums text-base-800">
                {filtered.length}
              </span>{" "}
              <span className="text-base-600">
                {pluralize(filtered.length, ["квартира", "квартиры", "квартир"])}
              </span>
            </div>
            <SortSelect value={sort} onChange={setSort} />
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto p-12"
            style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
          >
            {filtered.length === 0 ? (
              <div className="grid place-items-center py-20 text-center">
                <div>
                  <p className="font-display text-h3 text-base-800">Ничего не найдено</p>
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
                    <ApartmentCard apt={apt} onClick={() => nav(`/apartment/${apt.id}`)} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cards
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
      <div className="relative w-full overflow-hidden bg-base-100" style={{ aspectRatio: "4 / 3" }}>
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
        <span className="text-right font-medium text-base-800">{formatPrice(apt.pricePerMeter)}</span>
      </div>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter controls
// ─────────────────────────────────────────────────────────────────────────────

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8 first:mt-0">
      <h3 className="font-sans text-upper uppercase tracking-[0.2em] text-base-600">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
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
      className={`h-10 px-4 font-sans text-body font-medium transition-colors ${
        active ? "bg-night-500 text-base-0" : "border border-base-200 bg-base-0 text-base-800"
      }`}
    >
      {children}
    </Pressable>
  );
}

function RangeInputs({
  min,
  max,
  value,
  step,
  onChange,
  format,
}: {
  min: number;
  max: number;
  value: [number, number];
  step: number;
  onChange: (v: [number, number]) => void;
  format: (v: number) => string;
}) {
  const [lo, hi] = value;
  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={lo}
          min={min}
          max={hi}
          step={step}
          onChange={(e) => onChange([clamp(Number(e.target.value), min, hi), hi])}
          className="h-11 w-full border border-base-200 bg-base-0 px-3 font-sans text-body text-base-800 outline-none focus:border-accent"
        />
        <span className="text-base-600">—</span>
        <input
          type="number"
          value={hi}
          min={lo}
          max={max}
          step={step}
          onChange={(e) => onChange([lo, clamp(Number(e.target.value), lo, max)])}
          className="h-11 w-full border border-base-200 bg-base-0 px-3 font-sans text-body text-base-800 outline-none focus:border-accent"
        />
      </div>
      <div className="mt-2 flex items-center justify-between font-sans text-small text-base-600">
        <span>{format(lo)}</span>
        <span>{format(hi)}</span>
      </div>
    </div>
  );
}

function CheckboxRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="tap-surface flex items-center gap-3 text-left"
    >
      <span
        className={`grid h-6 w-6 place-items-center border transition-colors ${
          checked ? "border-accent bg-accent text-base-0" : "border-base-200 bg-base-0"
        }`}
      >
        {checked && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </span>
      <span className="font-sans text-body text-base-800">{children}</span>
    </button>
  );
}

function SortSelect({ value, onChange }: { value: SortKey; onChange: (k: SortKey) => void }) {
  const options: { k: SortKey; label: string }[] = [
    { k: "price-asc", label: "Сначала дешевле" },
    { k: "price-desc", label: "Сначала дороже" },
    { k: "area-asc", label: "Меньше площадь" },
    { k: "area-desc", label: "Больше площадь" },
    { k: "floor-asc", label: "Ниже этаж" },
    { k: "floor-desc", label: "Выше этаж" },
  ];
  return (
    <label className="flex h-11 items-center gap-3 border border-base-200 bg-base-0 px-4 font-sans text-body font-medium text-base-800">
      <span className="text-base-600">Сортировка</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="bg-transparent font-medium outline-none"
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

function clamp(v: number, lo: number, hi: number): number {
  if (Number.isNaN(v)) return lo;
  return Math.min(Math.max(v, lo), hi);
}

function pluralize(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}
