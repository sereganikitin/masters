import { Reveal } from "@/components/Reveal";
import { Pressable } from "@/components/Pressable";
import { OverlayLayer } from "@/components/OverlayLayer";
import { useOverlays } from "@/lib/useOverlays";
import { getHouse } from "@/data/complex";

// All 11 sections of the Masters complex, positioned over /images/hero-genplan.png
// at 1920×1080 scene coordinates. Counts are pulled from the live feed by section
// number; sections not yet in the feed render with just the number (no "N кв.").
const SECTION_POSITIONS: Record<number, { x: number; y: number }> = {
  1: { x: 560, y: 270 },
  2: { x: 760, y: 240 },
  3: { x: 925, y: 100 },
  4: { x: 1115, y: 100 },
  5: { x: 1295, y: 100 },
  6: { x: 1320, y: 530 },
  7: { x: 1145, y: 555 },
  8: { x: 955, y: 555 },
  9: { x: 800, y: 540 },
  10: { x: 615, y: 510 },
  11: { x: 480, y: 360 },
};

const SECTION_NUMBERS = Object.keys(SECTION_POSITIONS).map(Number);

// POI surrounding the complex — shown only on About-page embed, lighter style.
// Coordinates approximate the Figma reference; tweak as photo is refined.
interface POI {
  label: string;
  meta?: string;
  icon?: "up" | "down" | "left" | "right" | "school" | "kindergarten";
  pos: { x: number; y: number };
}

const POI_LABELS: POI[] = [
  { icon: "up", label: "Чапаевский парк", meta: "10 мин", pos: { x: 580, y: 50 } },
  { icon: "kindergarten", label: "Детский сад", pos: { x: 200, y: 95 } },
  { icon: "school", label: "Школа № 117", pos: { x: 1740, y: 320 } },
  { icon: "left", label: "Парк «Берёзовая роща»", meta: "10 мин", pos: { x: 220, y: 870 } },
  { label: "ТЦ «Авиапарк»", meta: "5 мин", pos: { x: 730, y: 985 } },
  { label: "м. ЦСКА", meta: "15 мин", pos: { x: 1200, y: 1005 } },
  { icon: "right", label: "ул. Викторенко", pos: { x: 1740, y: 650 } },
  { label: "ул. 3-я Песчаная", pos: { x: 1080, y: 870 } },
];

interface GenplanCanvasProps {
  /** Click handler — receives section number. Omit to make sections non-interactive. */
  onSectionPick?: (sectionNumber: number) => void;
  /** Currently activated section (gets the highlight). */
  activeSection?: number | null;
  /** Filter — sections returning false are hidden entirely. */
  isSectionVisible?: (sectionNumber: number) => boolean;
  /** Render admin-drawn polygons + their hover/active outlines. */
  showOverlays?: boolean;
  /** Render the surrounding POI labels (only used on the About embed). */
  showPOI?: boolean;
  /** Optional manual label position overrides keyed by entityId. */
  labelOffsets?: Record<string, [number, number]>;
  /** Shift section chips (dark) vertically in viewBox px (uniform offset). */
  sectionsOffsetY?: number;
  /** Per-section manual nudges, keyed by section number (1..11). [dx, dy] in viewBox px. */
  sectionOffsets?: Record<number, [number, number]>;
  /** Shift POI chips (light) vertically in viewBox px. */
  poiOffsetY?: number;
  /** Static-overlay mode: highlight stays purely visual, no hover/click on
   * the polygon. Used by ApartmentScreen's in-card genplan preview. */
  staticOverlay?: boolean;
  /** Scale factor applied to the section chip drawn by OverlayLayer.
   * 1 = kiosk default; bigger values read better in embedded previews. */
  chipScale?: number;
}

/**
 * Shared genplan canvas — aerial photo + section chips (and optionally POI
 * labels). Used in two places:
 *   1. /genplan (kiosk)            — interactive, with admin overlays + filters
 *   2. About → Генплан проекта     — non-interactive chips + POI labels
 */
export function GenplanCanvas({
  onSectionPick,
  activeSection = null,
  isSectionVisible,
  showOverlays = false,
  showPOI = false,
  labelOffsets,
  sectionsOffsetY = 0,
  sectionOffsets,
  poiOffsetY = 0,
  staticOverlay = false,
  chipScale = 1,
}: GenplanCanvasProps) {
  const house = getHouse();
  const { overlays, loading } = useOverlays("genplan", "");

  // Lookup live apartment counts by section number; undefined if no data yet.
  const countOf = (num: number): number | undefined =>
    house.sections.find((s) => s.number === num)?.apartmentCount;

  const interactive = Boolean(onSectionPick);
  const visibleSections = SECTION_NUMBERS.filter((n) =>
    isSectionVisible ? isSectionVisible(n) : true,
  );

  // Map activeSection (entity number) → the overlay row's database id so the
  // polygon itself paints in the «active» (filled blue) state, not just the
  // chip. Without this the SVG overlay stayed in its idle state even when the
  // chip was scaled up.
  const activeOverlayId =
    activeSection == null
      ? null
      : (overlays.find((o) => Number(o.entityId) === activeSection)?.id ?? null);

  // When showOverlays — the OverlayLayer renders its own chips. Static markers
  // serve as fallback ONLY if admin hasn't drawn anything. When showOverlays is
  // off (About embed), we always render static chips.
  const renderStaticChips =
    !showOverlays || (!loading && overlays.length === 0);

  return (
    <>
      <img
        src="/images/hero-genplan.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/40" />

      {/* Admin-drawn overlays */}
      {showOverlays && (
        <OverlayLayer
          scope="genplan"
          highlightId={activeOverlayId}
          interactive={!staticOverlay}
          chipScale={chipScale}
          isVisible={(o) => {
            const n = Number(o.entityId);
            return Number.isNaN(n) ? true : visibleSections.includes(n);
          }}
          labelOffsets={labelOffsets}
          onPick={(o) => {
            const num = Number(o.entityId);
            if (!Number.isNaN(num) && onSectionPick) onSectionPick(num);
          }}
        />
      )}

      {/* Static section chips */}
      {renderStaticChips && (
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden={!interactive}
        >
          {visibleSections.map((num, i) => {
            const pos = SECTION_POSITIONS[num];
            if (!pos) return null;
            const count = countOf(num);
            const isActive = activeSection === num;
            const nudge = sectionOffsets?.[num] ?? [0, 0];
            const xPct = ((pos.x + nudge[0]) / 1920) * 100;
            const yPct = ((pos.y + sectionsOffsetY + nudge[1]) / 1080) * 100;
            return (
              <Reveal
                key={num}
                mode="zoom"
                delay={Math.min(i * 40, 240)}
                className="absolute"
                style={{
                  left: `${xPct}%`,
                  top: `${yPct}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <SectionChip
                  number={num}
                  count={count}
                  active={isActive}
                  interactive={interactive}
                  onClick={() => onSectionPick?.(num)}
                />
              </Reveal>
            );
          })}
        </div>
      )}

      {/* POI surroundings (About only) */}
      {showPOI && (
        <div className="pointer-events-none absolute inset-0">
          {POI_LABELS.map((p, i) => {
            const xPct = (p.pos.x / 1920) * 100;
            const yPct = ((p.pos.y + poiOffsetY) / 1080) * 100;
            return (
              <Reveal
                key={`${p.label}-${i}`}
                mode="fade"
                delay={Math.min(i * 40, 240)}
                className="absolute"
                style={{
                  left: `${xPct}%`,
                  top: `${yPct}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <PoiChip label={p.label} meta={p.meta} icon={p.icon} />
              </Reveal>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function SectionChip({
  number,
  count,
  active,
  interactive,
  onClick,
}: {
  number: number;
  count: number | undefined;
  active: boolean;
  interactive: boolean;
  onClick: () => void;
}) {
  const content = (
    <>
      <span>{number} СЕКЦИЯ</span>
      {count !== undefined && count > 0 && (
        <>
          <span className="text-base-0/55">•</span>
          <span className="text-base-0/55">{count} КВ.</span>
        </>
      )}
    </>
  );
  const cls = `flex items-center gap-[6px] bg-night-500/95 px-[9px] font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-base-0 backdrop-blur-md transition-transform duration-300 ease-out ${active ? "scale-[1.08]" : ""}`;
  const style = { height: 22, borderRadius: 3 } as const;
  if (!interactive) {
    return (
      <span className={cls} style={style}>
        {content}
      </span>
    );
  }
  return (
    <Pressable
      onClick={onClick}
      rippleColor={active ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.18)"}
      className={cls}
      style={style}
    >
      {content}
    </Pressable>
  );
}

function PoiChip({
  label,
  meta,
  icon,
}: {
  label: string;
  meta?: string;
  icon?: POI["icon"];
}) {
  // Lighter, semi-transparent style so POI reads as ambient context — not the
  // primary interactive layer.
  return (
    <span
      className="flex items-center gap-[6px] bg-base-0/85 px-[9px] font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-base-800 backdrop-blur-md"
      style={{ height: 22, borderRadius: 3 }}
    >
      {icon && <PoiIcon icon={icon} />}
      <span>{label}</span>
      {meta && (
        <>
          <span className="text-base-600">·</span>
          <span className="text-base-600">{meta}</span>
        </>
      )}
    </span>
  );
}

function PoiIcon({ icon }: { icon: POI["icon"] }) {
  const cls = "h-3 w-3 flex-shrink-0";
  switch (icon) {
    case "up":
      return (
        <svg className={cls} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 10V2M3 5l3-3 3 3" />
        </svg>
      );
    case "down":
      return (
        <svg className={cls} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2v8M3 7l3 3 3-3" />
        </svg>
      );
    case "left":
      return (
        <svg className={cls} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 6H2M5 3 2 6l3 3" />
        </svg>
      );
    case "right":
      return (
        <svg className={cls} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6h8M7 3l3 3-3 3" />
        </svg>
      );
    case "school":
      return (
        <svg className={cls} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 5l5-3 5 3-5 3-5-3z" />
          <path d="M3 6.5V9c1 .6 2 1 3 1s2-.4 3-1V6.5" />
        </svg>
      );
    case "kindergarten":
      return (
        <svg className={cls} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
          <rect x={2} y={4} width={8} height={6} />
          <path d="M2 4l4-2 4 2" />
        </svg>
      );
    default:
      return null;
  }
}
