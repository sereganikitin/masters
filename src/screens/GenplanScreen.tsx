import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { OverlayChrome } from "@/components/OverlayChrome";
import { Reveal } from "@/components/Reveal";
import { Pressable } from "@/components/Pressable";
import { OverlayLayer } from "@/components/OverlayLayer";
import { useOverlays } from "@/lib/useOverlays";
import { getHouse, formatPrice, ROOM_TYPES } from "@/data/complex";
import { IconArrowRight, IconCube, IconMap } from "@/components/Icon";

// Approximate marker positions over /images/hero-genplan.png (1920x1080 stage).
// These are visual approximations — refine against the real aerial photo if needed.
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
  const active = useMemo(
    () => (activeNum == null ? null : house.sections.find((s) => s.number === activeNum) ?? null),
    [house, activeNum],
  );

  // Admin-drawn overlays. If present they take over from the static markers.
  const { overlays: sectionOverlays } = useOverlays("genplan", "");
  const activeOverlayId = useMemo(() => {
    if (active == null) return null;
    const m = sectionOverlays.find((o) => Number(o.entityId) === active.number);
    return m?.id ?? null;
  }, [sectionOverlays, active]);

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
        onPick={(o) => {
          const num = Number(o.entityId);
          if (!Number.isNaN(num)) setActiveNum(num);
        }}
      />

      {/* Static fallback markers — visible only if no overlays defined */}
      {sectionOverlays.length === 0 && (
        <div className="absolute inset-0">
          {house.sections.map((s, i) => {
            const pos = MARKERS[s.number] ?? { x: 200 + s.number * 200, y: 400 };
            const isActive = active != null && s.number === active.number;
            return (
              <Reveal
                key={s.id}
                mode="zoom"
                delay={i * 80}
                className="absolute"
                style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -50%)" }}
              >
                <Pressable
                  onClick={() => setActiveNum(s.number)}
                  rippleColor={isActive ? "rgba(255,255,255,0.3)" : "rgba(0,97,166,0.2)"}
                  className={`px-3 py-1.5 font-display text-[12px] font-semibold uppercase tracking-[0.15em] backdrop-blur-md ${
                    isActive
                      ? "bg-accent text-base-0 shadow-card"
                      : "bg-base-0/85 text-base-800"
                  }`}
                >
                  {s.number} секция · {s.apartmentCount} кв.
                </Pressable>
              </Reveal>
            );
          })}
        </div>
      )}

      {/* Street label */}
      <Reveal mode="up" delay={400} className="absolute bottom-10 left-10 z-10">
        <div className="bg-accent px-5 py-2 font-sans text-body font-medium text-base-0">
          ул. 3-я Песчаная
        </div>
      </Reveal>

      {/* Bottom-right controls */}
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

      {/* Section detail panel — visible only when a section is picked */}
      {active && (
        <SectionPanel
          section={active}
          onOpenSection={() => nav(`/section/${active.number}`)}
        />
      )}
    </div>
  );
}

interface PanelProps {
  section: ReturnType<typeof getHouse>["sections"][number];
  onOpenSection: () => void;
}

function SectionPanel({ section, onOpenSection }: PanelProps) {
  const house = getHouse();
  // Per Figma: section panel shows only the room types that actually exist in the feed.
  // labels are in genitive plural ("Студии", "1-комн.", "2-комн.", ...).
  const rowLabels: Record<string, string> = {
    studio: "Студии",
    "1": "1-комн.",
    "2": "2-комн.",
    "3": "3-комн.",
    "4+": "4-комн. и более",
  };
  const rows = ROOM_TYPES.filter((rt) => section.byRoomType[rt.key].count > 0).map((rt) => ({
    key: rt.key,
    label: rowLabels[rt.key] ?? rt.label,
    ...section.byRoomType[rt.key],
  }));
  const aptWord = pluralize(section.apartmentCount, ["квартиру", "квартиры", "квартир"]);

  // Per Figma 13558:78061 — right panel 360×617 in 1440 stage → 480×820 here.
  // Title "N СЕКЦИЯ" UPPER in Unbounded H5 (24px → 32px on scale).
  // Meta row: "Корпус N · до X этажей · Сдача …" — 14px Medium with dot separators.
  // Rows: count (32) | type (Студии) | "от X млн ₽" — 14px throughout.
  // CTA: full-width 14px Medium accent button.
  return (
    <Reveal
      mode="left"
      delay={250}
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

        <Pressable
          onClick={onOpenSection}
          rippleColor="rgba(255,255,255,0.25)"
          className="mt-7 flex h-14 w-full items-center justify-between bg-accent px-6 font-sans text-small font-medium text-base-0"
        >
          <span>
            Смотреть {section.apartmentCount} {aptWord}
          </span>
          <IconArrowRight size={20} />
        </Pressable>
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
