import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { OverlayChrome } from "@/components/OverlayChrome";
import { Pressable } from "@/components/Pressable";
import { GenplanCanvas } from "@/components/GenplanCanvas";
import { getHouse, ROOM_TYPES, formatPrice, formatArea } from "@/data/complex";
import { IconCube, IconMap, IconArrowRight } from "@/components/Icon";
import type { RoomType, Apartment } from "@/data/types";

export function GenplanScreen() {
  const nav = useNavigate();
  const house = getHouse();

  const [rooms, setRooms] = useState<Set<RoomType>>(new Set());
  /**
   * Two-tap selection state. First tap on a section sets it as «active»
   * and surfaces the info card; a second tap on the same active section
   * navigates to the catalog. Tapping a different section just switches
   * the active one (no nav).
   */
  const [activeSection, setActiveSection] = useState<number | null>(null);

  // A section is visible iff it has apartments matching the room filter.
  // Sections not in the feed yet are visible only when no filter is applied,
  // because we can't verify them against criteria.
  const sectionVisible = (sectionNumber: number): boolean => {
    const section = house.sections.find((s) => s.number === sectionNumber);
    if (!section) {
      return rooms.size === 0;
    }
    if (rooms.size === 0) return true;
    const apts: Apartment[] = Object.values(section.apartmentsByFloor).flat();
    return apts.some((a) => rooms.has(a.roomType));
  };

  const navigateToCatalog = (sectionNumber: number) => {
    const params = new URLSearchParams();
    params.set("section", String(sectionNumber));
    if (rooms.size > 0) params.set("rooms", Array.from(rooms).join(","));
    nav(`/catalog?${params.toString()}`);
  };

  const handleSectionPick = (sectionNumber: number) => {
    if (activeSection === sectionNumber) {
      navigateToCatalog(sectionNumber);
    } else {
      setActiveSection(sectionNumber);
    }
  };

  const toggleRoom = (rt: RoomType) =>
    setRooms((prev) => {
      const next = new Set(prev);
      next.has(rt) ? next.delete(rt) : next.add(rt);
      return next;
    });

  // Room-type chips are only clickable when at least one apartment in any
  // section matches that type. Types that aren't in the live feed (e.g.
  // currently no Studios or 4+ at МАСТЕРС) render dimmed and inert; if the
  // feed later adds them, they automatically re-enable.
  const availableRoomTypes = useMemo<Set<RoomType>>(() => {
    const s = new Set<RoomType>();
    for (const section of house.sections) {
      for (const apt of Object.values(section.apartmentsByFloor).flat()) {
        s.add(apt.roomType);
      }
    }
    return s;
  }, [house]);

  const activeInfo = useMemo(() => {
    if (activeSection == null) return null;
    const s = house.sections.find((x) => x.number === activeSection);
    if (!s) return null;
    const apts = Object.values(s.apartmentsByFloor).flat();
    const filtered =
      rooms.size === 0 ? apts : apts.filter((a) => rooms.has(a.roomType));
    if (filtered.length === 0) return null;
    const prices = filtered.map((a) => a.price);
    const areas = filtered.map((a) => a.area);
    return {
      number: s.number,
      storeysRange: s.storeysRange,
      count: filtered.length,
      minPrice: Math.min(...prices),
      minArea: Math.min(...areas),
      maxArea: Math.max(...areas),
    };
  }, [activeSection, house, rooms]);

  return (
    <div
      className="relative h-full w-full bg-night-500"
      onClick={(e) => {
        // Tapping the dark backdrop (anything that isn't a section / chrome /
        // chip) clears the active selection.
        if (e.target === e.currentTarget) setActiveSection(null);
      }}
    >
      <GenplanCanvas
        showOverlays
        onSectionPick={handleSectionPick}
        activeSection={activeSection}
        isSectionVisible={sectionVisible}
        labelOffsets={{ "5": [40, 0] }}
      />

      <OverlayChrome />

      {/* Info card — surfaced after the first tap on a section. A second
        * tap on the same section (or the «Выбрать квартиру» CTA) navigates
        * to the catalog filtered to that section. */}
      {activeInfo && (
        <div className="pointer-events-none absolute right-10 top-10 z-30">
          <div className="pointer-events-auto w-[320px] bg-base-0/95 p-6 shadow-card backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-sans text-upper uppercase tracking-[0.3em] text-base-600">
                  Секция {activeInfo.number}
                </p>
                <p className="mt-1 font-sans text-small text-base-600">
                  {activeInfo.storeysRange} эт.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection(null)}
                className="grid h-9 w-9 place-items-center text-base-600 hover:text-base-800"
                aria-label="Закрыть"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
                  <path d="M2 2l10 10M12 2L2 12" />
                </svg>
              </button>
            </div>

            <div className="mt-6 space-y-3 border-t border-base-200 pt-5 font-sans text-small">
              <div className="flex justify-between">
                <span className="text-base-600">Квартир</span>
                <span className="font-medium text-base-800">{activeInfo.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-600">Площадь</span>
                <span className="font-medium text-base-800">
                  {formatArea(activeInfo.minArea)}–{formatArea(activeInfo.maxArea)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-600">Цена от</span>
                <span className="font-medium text-base-800">
                  {formatPrice(activeInfo.minPrice)}
                </span>
              </div>
            </div>

            <Pressable
              onClick={() => navigateToCatalog(activeInfo.number)}
              rippleColor="rgba(255,255,255,0.25)"
              className="mt-6 flex h-12 w-full items-center justify-between bg-accent px-5 font-sans text-body font-medium text-base-0"
            >
              Выбрать квартиру
              <IconArrowRight size={18} />
            </Pressable>
          </div>
        </div>
      )}

      {/* Bottom-left — room filter chips. z-30 above overlay SVGs.
        * No Reveal wrapper — IntersectionObserver is unreliable on the scaled stage. */}
      <div className="absolute bottom-10 left-10 z-30">
        <div className="flex flex-wrap items-center gap-2">
          {ROOM_TYPES.map((rt) => {
            const enabled = availableRoomTypes.has(rt.key);
            const active = enabled && rooms.has(rt.key);
            return (
              <Pressable
                key={rt.key}
                onClick={() => enabled && toggleRoom(rt.key)}
                disabled={!enabled}
                rippleColor={active ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.08)"}
                className={`h-12 px-5 font-sans text-body font-medium transition-colors ${
                  !enabled
                    ? "cursor-not-allowed border border-base-200 bg-base-0/50 text-base-800/35"
                    : active
                      ? "bg-night-500 text-base-0"
                      : "border border-base-600 bg-base-0/95 text-base-800"
                }`}
                title={!enabled ? "Нет квартир такого типа" : undefined}
              >
                {rt.label}
              </Pressable>
            );
          })}
        </div>
      </div>

      {/* Bottom-right — disabled infrastructure toggle + 3D-tour. */}
      <div className="absolute bottom-10 right-10 z-30">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 items-center gap-3 bg-base-0/95 px-5 font-sans text-body font-medium text-base-800 backdrop-blur-sm"
            aria-disabled="true"
            title="Скоро"
          >
            <IconMap size={18} className="opacity-40" />
            <span className="opacity-60">Инфраструктура</span>
            <span
              className="relative inline-block h-5 w-9 rounded-full bg-base-200"
              aria-hidden="true"
            >
              <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-base-0 shadow-card" />
            </span>
          </div>

          <Pressable
            onClick={() => nav("/tour")}
            rippleColor="rgba(0,0,0,0.12)"
            className="flex h-12 items-center gap-3 bg-base-0/95 px-5 font-sans text-body font-medium text-base-800 backdrop-blur-sm"
          >
            <IconCube size={18} />
            3D-тур
          </Pressable>
        </div>
      </div>
    </div>
  );
}
