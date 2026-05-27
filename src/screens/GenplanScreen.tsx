import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { OverlayChrome } from "@/components/OverlayChrome";
import { Reveal } from "@/components/Reveal";
import { Pressable } from "@/components/Pressable";
import { OverlayLayer } from "@/components/OverlayLayer";
import { useOverlays } from "@/lib/useOverlays";
import { getHouse, formatPrice, ROOM_TYPES } from "@/data/complex";
import { IconArrowRight, IconCube, IconMap } from "@/components/Icon";
import type { RoomType, Apartment } from "@/data/types";
import type { Overlay } from "@/lib/overlays";

// Approximate marker positions over /images/hero-genplan.png (1920x1080 stage).
const MARKERS: Record<number, { x: number; y: number }> = {
  1: { x: 540, y: 360 },
  2: { x: 820, y: 520 },
  3: { x: 980, y: 380 },
  4: { x: 1180, y: 260 },
  5: { x: 1300, y: 460 },
  6: { x: 1080, y: 620 },
};

export function GenplanScreen() {
  const nav = useNavigate();
  const house = getHouse();

  const [activeNum, setActiveNum] = useState<number | null>(null);
  const [rooms, setRooms] = useState<Set<RoomType>>(new Set());

  const floorBounds = useMemo(() => {
    const all = house.sections.flatMap((s) =>
      Object.keys(s.apartmentsByFloor).map(Number),
    );
    return {
      min: all.length ? Math.min(...all) : 1,
      max: all.length ? Math.max(...all) : 25,
    };
  }, [house]);
  const [floorMin, setFloorMin] = useState<number>(floorBounds.min);
  const [floorMax, setFloorMax] = useState<number>(floorBounds.max);

  const sectionMatches = (sectionNumber: number): boolean => {
    const section = house.sections.find((s) => s.number === sectionNumber);
    if (!section) return false;
    const apts: Apartment[] = Object.values(section.apartmentsByFloor).flat();
    return apts.some((a) => {
      if (rooms.size > 0 && !rooms.has(a.roomType)) return false;
      if (a.floor < floorMin || a.floor > floorMax) return false;
      return true;
    });
  };

  const active = useMemo(
    () => (activeNum == null ? null : house.sections.find((s) => s.number === activeNum) ?? null),
    [house, activeNum],
  );

  const { overlays: sectionOverlays, loading: overlaysLoading } = useOverlays("genplan", "");
  const activeOverlayId = useMemo(() => {
    if (active == null) return null;
    const m = sectionOverlays.find((o) => Number(o.entityId) === active.number);
    return m?.id ?? null;
  }, [sectionOverlays, active]);

  const isOverlayEnabled = (o: Overlay) => {
    const n = Number(o.entityId);
    if (Number.isNaN(n)) return true;
    return sectionMatches(n);
  };

  const openCatalog = (sectionNumber: number) => {
    const params = new URLSearchParams();
    params.set("section", String(sectionNumber));
    if (rooms.size > 0) params.set("rooms", Array.from(rooms).join(","));
    if (floorMin !== floorBounds.min || floorMax !== floorBounds.max) {
      params.set("floor", `${floorMin}-${floorMax}`);
    }
    nav(`/catalog?${params.toString()}`);
  };

  // Two-tap pattern:
  //   1st tap on a section  → activate it (show panel + bold outline)
  //   2nd tap on the same   → open catalog filtered by that section
  //   tap on another        → switch active section
  const handleSectionTap = (sectionNumber: number) => {
    if (activeNum === sectionNumber) {
      openCatalog(sectionNumber);
    } else {
      setActiveNum(sectionNumber);
    }
  };

  const toggleRoom = (rt: RoomType) =>
    setRooms((prev) => {
      const next = new Set(prev);
      next.has(rt) ? next.delete(rt) : next.add(rt);
      return next;
    });

  return (
    <div className="relative h-full w-full bg-night-500">
      <img
        src="/images/hero-genplan.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />

      <OverlayChrome />

      {/* Admin-drawn overlays */}
      <OverlayLayer
        scope="genplan"
        highlightId={activeOverlayId}
        isEnabled={isOverlayEnabled}
        labelOffsets={{ "5": [40, 0] }}
        onPick={(o) => {
          const num = Number(o.entityId);
          if (!Number.isNaN(num)) handleSectionTap(num);
        }}
      />

      {/* Static fallback markers — only when API replied AND there are no overlays.
        * Holding back render until !overlaysLoading avoids the brief flash of
        * light-themed chips before the dark admin chips appear. */}
      {!overlaysLoading && sectionOverlays.length === 0 && (
        <div className="absolute inset-0">
          {house.sections.map((s, i) => {
            const pos = MARKERS[s.number] ?? { x: 200 + s.number * 200, y: 400 };
            const isActive = active != null && s.number === active.number;
            const enabled = sectionMatches(s.number);
            return (
              <Reveal
                key={s.id}
                mode="zoom"
                delay={i * 80}
                className="absolute"
                style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -50%)" }}
              >
                <Pressable
                  disabled={!enabled}
                  onClick={() => enabled && handleSectionTap(s.number)}
                  rippleColor={isActive ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.18)"}
                  className={`flex items-center gap-[6px] px-[9px] font-sans text-[11px] font-medium uppercase tracking-[0.08em] backdrop-blur-md transition-all ${
                    !enabled
                      ? "bg-night-500/40 text-base-0/40"
                      : "bg-night-500/95 text-base-0"
                  } ${isActive ? "scale-[1.08]" : ""}`}
                  style={{ height: 22, borderRadius: 3 }}
                >
                  <span>{s.number} СЕКЦИЯ</span>
                  <span className="text-base-0/55">•</span>
                  <span className="text-base-0/55">{s.apartmentCount} КВ.</span>
                </Pressable>
              </Reveal>
            );
          })}
        </div>
      )}

      {/* Bottom-left — filters */}
      <Reveal
        mode="up"
        delay={300}
        className="absolute bottom-10 left-10 z-10 flex flex-col gap-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          {ROOM_TYPES.map((rt) => {
            const active = rooms.has(rt.key);
            return (
              <Pressable
                key={rt.key}
                onClick={() => toggleRoom(rt.key)}
                rippleColor={active ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.08)"}
                className={`h-12 px-5 font-sans text-body font-medium transition-colors ${
                  active
                    ? "bg-night-500 text-base-0"
                    : "border border-base-200 bg-base-0/95 text-base-800"
                }`}
              >
                {rt.label}
              </Pressable>
            );
          })}
        </div>

        <div className="flex items-center gap-2 bg-base-0/95 px-4 py-2 backdrop-blur-md">
          <span className="font-sans text-small font-medium uppercase tracking-[0.15em] text-base-600">
            Этаж
          </span>
          <input
            type="number"
            min={floorBounds.min}
            max={floorMax}
            value={floorMin}
            onChange={(e) =>
              setFloorMin(
                Math.max(floorBounds.min, Math.min(Number(e.target.value), floorMax)),
              )
            }
            className="h-9 w-16 border border-base-200 bg-base-0 px-2 font-sans text-body tabular-nums text-base-800 outline-none focus:border-accent"
          />
          <span className="text-base-600">—</span>
          <input
            type="number"
            min={floorMin}
            max={floorBounds.max}
            value={floorMax}
            onChange={(e) =>
              setFloorMax(
                Math.min(floorBounds.max, Math.max(Number(e.target.value), floorMin)),
              )
            }
            className="h-9 w-16 border border-base-200 bg-base-0 px-2 font-sans text-body tabular-nums text-base-800 outline-none focus:border-accent"
          />
          {(floorMin !== floorBounds.min || floorMax !== floorBounds.max) && (
            <button
              type="button"
              onClick={() => {
                setFloorMin(floorBounds.min);
                setFloorMax(floorBounds.max);
              }}
              className="ml-1 font-sans text-small text-base-600 hover:text-base-800"
              title="Сбросить"
            >
              ×
            </button>
          )}
        </div>
      </Reveal>

      {/* Bottom-right — infrastructure / 3D tour */}
      <Reveal mode="up" delay={400} className="absolute bottom-10 right-10 z-10">
        <div className="flex items-center gap-3">
          <Pressable
            rippleColor="rgba(0,0,0,0.12)"
            className="flex h-14 items-center gap-3 bg-base-0/95 px-6 font-sans text-body font-medium text-base-800 backdrop-blur-sm"
          >
            <IconMap size={20} />
            Инфраструктура
          </Pressable>
          <Pressable
            onClick={() => nav("/tour")}
            rippleColor="rgba(0,0,0,0.12)"
            className="flex h-14 items-center gap-3 bg-base-0/95 px-6 font-sans text-body font-medium text-base-800 backdrop-blur-sm"
          >
            <IconCube size={20} />
            3D-тур
          </Pressable>
        </div>
      </Reveal>

      {/* Section detail panel — visible when a section is activated */}
      {active && (
        <SectionPanel
          section={active}
          rooms={rooms}
          floorMin={floorMin}
          floorMax={floorMax}
          onOpenSection={() => openCatalog(active.number)}
        />
      )}
    </div>
  );
}

interface PanelProps {
  section: ReturnType<typeof getHouse>["sections"][number];
  rooms: Set<RoomType>;
  floorMin: number;
  floorMax: number;
  onOpenSection: () => void;
}

function SectionPanel({ section, rooms, floorMin, floorMax, onOpenSection }: PanelProps) {
  const house = getHouse();
  const rowLabels: Record<string, string> = {
    studio: "Студии",
    "1": "1-комн.",
    "2": "2-комн.",
    "3": "3-комн.",
    "4+": "4-комн. и более",
  };

  const filteredByRoom = useMemo(() => {
    const result: Record<string, { count: number; minPrice: number; minArea: number }> = {};
    for (const rt of ROOM_TYPES) {
      result[rt.key] = { count: 0, minPrice: 0, minArea: 0 };
    }
    const apts: Apartment[] = Object.values(section.apartmentsByFloor).flat();
    for (const a of apts) {
      if (rooms.size > 0 && !rooms.has(a.roomType)) continue;
      if (a.floor < floorMin || a.floor > floorMax) continue;
      const r = result[a.roomType];
      r.count += 1;
      if (r.minPrice === 0 || a.price < r.minPrice) r.minPrice = a.price;
      if (r.minArea === 0 || a.area < r.minArea) r.minArea = a.area;
    }
    return result;
  }, [section, rooms, floorMin, floorMax]);

  const rows = ROOM_TYPES.filter((rt) => filteredByRoom[rt.key].count > 0).map((rt) => ({
    key: rt.key,
    label: rowLabels[rt.key] ?? rt.label,
    ...filteredByRoom[rt.key],
  }));
  const totalCount = rows.reduce((n, r) => n + r.count, 0);
  const aptWord = pluralize(totalCount, ["квартиру", "квартиры", "квартир"]);

  return (
    <Reveal
      mode="left"
      delay={150}
      key={section.id}
      className="absolute right-10 top-1/2 z-10 w-[480px] -translate-y-1/2"
    >
      <div className="bg-base-0/95 px-8 py-8 shadow-card backdrop-blur-md">
        <h2 className="font-display text-[32px] font-semibold uppercase leading-none tracking-[0.02em] text-base-800">
          {section.number} секция
        </h2>

        <div className="mt-4 flex items-center gap-3 font-sans text-small font-medium text-base-600">
          <span>Корпус {house.number}</span>
          <span className="h-1 w-1 rounded-full bg-base-200" />
          <span>до {section.highFloor} этажей</span>
          <span className="h-1 w-1 rounded-full bg-base-200" />
          <span>Сдача {house.endDate}</span>
        </div>

        {rows.length > 0 ? (
          <div className="mt-7 divide-y divide-base-200 border-y border-base-200">
            {rows.map((r) => (
              <div
                key={r.key}
                className="grid grid-cols-[44px_1fr_auto] items-center gap-3 py-3.5"
              >
                <span className="font-display text-[20px] font-semibold tabular-nums text-base-800">
                  {r.count}
                </span>
                <span className="font-sans text-small font-medium text-base-800">{r.label}</span>
                <span className="font-sans text-small text-base-600">
                  от {formatPrice(r.minPrice)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-7 border-y border-base-200 py-6 text-center font-sans text-small text-base-600">
            Нет квартир под выбранные фильтры
          </p>
        )}

        <Pressable
          onClick={onOpenSection}
          disabled={totalCount === 0}
          rippleColor="rgba(255,255,255,0.25)"
          className="mt-7 flex h-14 w-full items-center justify-between bg-accent px-6 font-sans text-small font-medium text-base-0 disabled:opacity-50"
        >
          <span>
            Смотреть {totalCount} {aptWord}
          </span>
          <IconArrowRight size={20} />
        </Pressable>

        <p className="mt-3 text-center font-sans text-[11px] text-base-600">
          Тапните по секции ещё раз, чтобы перейти к выбору квартир
        </p>
      </div>
    </Reveal>
  );
}

function pluralize(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}
