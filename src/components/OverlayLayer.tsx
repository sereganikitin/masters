import { useState } from "react";
import { useOverlays } from "@/lib/useOverlays";
import type { Overlay, OverlayScope } from "@/lib/overlays";

interface OverlayLayerProps {
  scope: OverlayScope;
  scopeKey?: string;
  /** ViewBox dimensions — must match the coordinate space used in the admin editor. */
  width?: number;
  height?: number;
  /** Click/tap handler — receives the overlay that was tapped. */
  onPick?: (o: Overlay) => void;
  /** Currently highlighted (active) overlay id — survives across hover changes. */
  highlightId?: number | null;
  /** Show overlay labels at polygon centroid. */
  showLabels?: boolean;
  /** Optional predicate. When provided, overlays for which it returns false
   * are rendered dimmed and aren't clickable. */
  isEnabled?: (o: Overlay) => boolean;
}

/**
 * Split label "1 секция · 75 кв." into a primary part (before separator) and a
 * secondary part (after). Separator can be · • or -.
 */
function splitLabel(label: string): { primary: string; secondary: string } {
  const m = label.match(/^(.+?)\s*[·•\-]\s*(.+)$/);
  if (!m) return { primary: label, secondary: "" };
  return { primary: m[1].trim(), secondary: m[2].trim() };
}

export function OverlayLayer({
  scope,
  scopeKey = "",
  width = 1920,
  height = 1080,
  onPick,
  highlightId = null,
  showLabels = true,
  isEnabled,
}: OverlayLayerProps) {
  const { overlays } = useOverlays(scope, scopeKey);
  const [hoverId, setHoverId] = useState<number | null>(null);

  if (overlays.length === 0) return null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {overlays.map((o) => {
        const enabled = isEnabled ? isEnabled(o) : true;
        const isActive = enabled && highlightId === o.id;
        const isHover = enabled && hoverId === o.id && !isActive;
        const anchor = computeLabelAnchor(o.points);
        const { primary, secondary } = splitLabel(o.label);

        // Three render states:
        //   active  — clicked / selected: chip in accent + stroke + 32% fill
        //   hover   — desktop pointer preview: faint stroke only (no chip recolor)
        //   default — chip visible, polygon completely transparent
        const fillOpacity = isActive ? 0.32 : 0;
        const strokeOpacity = isActive ? 1 : isHover ? 0.55 : 0;
        const strokeWidth = isActive ? 2 : 1.5;

        return (
          <g
            key={o.id}
            className={enabled ? "pointer-events-auto" : "pointer-events-none"}
            style={{ cursor: enabled && onPick ? "pointer" : "default" }}
            onClick={() => enabled && onPick?.(o)}
            onPointerEnter={() => enabled && setHoverId(o.id)}
            onPointerLeave={() => setHoverId((h) => (h === o.id ? null : h))}
          >
            <path
              d={pointsToPath(o.points)}
              fill={o.color}
              fillOpacity={fillOpacity}
              stroke={o.color}
              strokeWidth={strokeWidth}
              strokeOpacity={strokeOpacity}
              vectorEffect="non-scaling-stroke"
              style={{
                transition:
                  "fill-opacity 220ms ease, stroke-opacity 220ms ease, stroke-width 220ms ease",
              }}
            />

            {/* Info chip — recolors only on the activated state, not on hover */}
            {showLabels && o.label && (
              <ChipLabel
                cx={anchor[0]}
                cy={anchor[1]}
                primary={primary}
                secondary={secondary}
                active={isActive}
                dimmed={!enabled}
                accentColor={o.color}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

interface ChipLabelProps {
  cx: number;
  cy: number;
  primary: string;
  secondary: string;
  active: boolean;
  dimmed: boolean;
  accentColor: string;
}

function ChipLabel({ cx, cy, primary, secondary, active, dimmed, accentColor }: ChipLabelProps) {
  // Coordinates are in viewBox space (1920×1080). Chip kept compact and light.
  const fontPx = 11;
  const charW = fontPx * 0.62;
  const padX = 9;
  const sepW = secondary ? fontPx * 1.4 : 0; // bullet "•" with gaps
  const w = Math.round(
    primary.length * charW + sepW + secondary.length * charW + padX * 2,
  );
  const h = 22;

  const bg = active ? accentColor : "#19212C";
  const primaryFill = "#FFFFFF";
  const secondaryFill = active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.55)";
  const opacity = dimmed ? 0.35 : 1;

  return (
    <g
      transform={`translate(${cx}, ${cy})`}
      style={{ transition: "opacity 220ms ease" }}
      opacity={opacity}
    >
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={3}
        fill={bg}
        style={{ transition: "fill 220ms ease" }}
      />
      <text
        x={0}
        y={4}
        fontFamily="Onest, system-ui, sans-serif"
        fontSize={fontPx}
        fontWeight={500}
        letterSpacing="0.08em"
        textAnchor="middle"
      >
        <tspan fill={primaryFill}>{primary.toUpperCase()}</tspan>
        {secondary && (
          <>
            <tspan dx={sepW * 0.35} fill={secondaryFill}>
              •
            </tspan>
            <tspan dx={sepW * 0.35} fill={secondaryFill}>
              {secondary.toUpperCase()}
            </tspan>
          </>
        )}
      </text>
    </g>
  );
}

function pointsToPath(points: [number, number][]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  const head = `M ${first[0]} ${first[1]}`;
  const body = rest.map((p) => `L ${p[0]} ${p[1]}`).join(" ");
  return `${head} ${body} Z`;
}

/**
 * Anchor the label vertically near the middle of the polygon — so all chips
 * line up along a soft arc that follows the buildings instead of jumping
 * with each shape's centroid or hugging the baseline.
 *   X — horizontal mean of all points (visual centre of the polygon).
 *   Y — interpolation between top and bottom; 0.5 = middle.
 */
const ANCHOR_BIAS = 0.25; // 0 = top, 1 = bottom — chips sit near building tops

function computeLabelAnchor(points: [number, number][]): [number, number] {
  if (points.length === 0) return [0, 0];
  let sumX = 0;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    sumX += x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const cx = sumX / points.length;
  const cy = minY + (maxY - minY) * ANCHOR_BIAS;
  return [cx, cy];
}
