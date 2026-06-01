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
  /** Optional predicate. When provided, overlays for which it returns false
   * are not rendered at all (hard hide vs. soft dim from `isEnabled`). */
  isVisible?: (o: Overlay) => boolean;
  /** Per-entity manual nudge for the chip position, in viewBox units.
   * Useful when a polygon's geometric centre doesn't read as the visual centre
   * (e.g. building facing at an angle). Keyed by entityId. */
  labelOffsets?: Record<string, [number, number]>;
  /** When false, hover/cursor state is suppressed and the SVG is rendered
   * with pointer-events disabled — the highlight stays purely visual.
   * Used by embedded context views (apartment card → genplan tab). */
  interactive?: boolean;
  /** Scale the chip label (font + padding + height) by this factor. 1.0
   * matches the kiosk Genplan; 1.5 makes the chip read as larger when the
   * canvas is embedded smaller (e.g. inside the apartment card). */
  chipScale?: number;
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
  isVisible,
  labelOffsets,
  interactive = true,
  chipScale = 1,
}: OverlayLayerProps) {
  const { overlays: rawOverlays } = useOverlays(scope, scopeKey);
  const overlays = isVisible ? rawOverlays.filter(isVisible) : rawOverlays;
  const [hoverId, setHoverId] = useState<number | null>(null);
  // In static mode every hover tracker is short-circuited so the highlight
  // never flickers when the cursor sweeps across the embedded preview.
  const effectiveHoverId = interactive ? hoverId : null;

  if (overlays.length === 0) return null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        {overlays.map((o) => (
          <clipPath key={`clip-${o.id}`} id={`overlay-clip-${o.id}`}>
            <path d={pointsToPath(o.points)} />
          </clipPath>
        ))}
      </defs>

      {overlays.map((o) => {
        const enabled = isEnabled ? isEnabled(o) : true;
        const isActive = enabled && highlightId === o.id;
        const isHover = enabled && effectiveHoverId === o.id && !isActive;
        const isHighlighted = isActive || isHover;
        const baseAnchor = computeLabelAnchor(o.points);
        const off = labelOffsets?.[o.entityId];
        const anchor: [number, number] = off
          ? [baseAnchor[0] + off[0], baseAnchor[1] + off[1]]
          : baseAnchor;
        const { primary, secondary } = splitLabel(o.label);
        const d = pointsToPath(o.points);

        // White outer contour. Active stroke is twice the hover stroke.
        const hoverStroke = 1.5;
        const activeStroke = hoverStroke * 2;
        const strokeWidth = isActive ? activeStroke : hoverStroke;
        const strokeOpacity = isHighlighted ? 1 : 0;

        // Hover  → soft inner glow (gradient from the rim).
        // Active → flat coloured fill across the whole polygon (no glow).
        const glowOpacity = isHover ? 0.35 : 0;
        const glowRadius = 50;
        const fillOpacity = isActive ? 0.32 : 0;

        return (
          <g
            key={o.id}
            className={
              enabled && interactive ? "pointer-events-auto" : "pointer-events-none"
            }
            style={{
              cursor: enabled && interactive && onPick ? "pointer" : "default",
            }}
            onClick={() => enabled && interactive && onPick?.(o)}
            onPointerEnter={() => enabled && interactive && setHoverId(o.id)}
            onPointerLeave={() =>
              interactive && setHoverId((h) => (h === o.id ? null : h))
            }
          >
            {/* Hitbox + active flat fill — same path, fade-in opacity on activation */}
            <path
              d={d}
              fill={o.color}
              fillOpacity={fillOpacity}
              stroke="none"
              style={{
                transition: "fill-opacity 280ms ease",
              }}
            />

            {/* Inner glow — coloured blurred stroke clipped to the polygon (hover only) */}
            <g clipPath={`url(#overlay-clip-${o.id})`} style={{ pointerEvents: "none" }}>
              <path
                d={d}
                fill="none"
                stroke={o.color}
                strokeWidth={glowRadius}
                strokeOpacity={glowOpacity}
                strokeLinejoin="round"
                style={{
                  filter: "blur(14px)",
                  transition:
                    "stroke-opacity 320ms ease, stroke-width 320ms ease",
                }}
              />
            </g>

            {/* White outer contour */}
            <path
              d={d}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={strokeWidth}
              strokeOpacity={strokeOpacity}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              style={{
                transition:
                  "stroke-opacity 280ms ease, stroke-width 280ms cubic-bezier(0.2, 0.7, 0.2, 1)",
              }}
            />

            {showLabels && o.label && (
              <ChipLabel
                cx={anchor[0]}
                cy={anchor[1]}
                primary={primary}
                secondary={secondary}
                emphasised={isHighlighted}
                dimmed={!enabled}
                scale={chipScale}
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
  /** Hovered or activated — chip gets a subtle scale + lift. */
  emphasised: boolean;
  /** Filtered out — chip dims. */
  dimmed: boolean;
  /** Multiplier applied to every chip dimension (font, padding, height). */
  scale?: number;
}

function ChipLabel({
  cx,
  cy,
  primary,
  secondary,
  emphasised,
  dimmed,
  scale: sizeScale = 1,
}: ChipLabelProps) {
  // Coordinates are in viewBox space (1920×1080). Chip kept compact and light;
  // always Imperial Night tone — only scale/opacity respond to state, no colour change.
  const fontPx = 11 * sizeScale;
  const charW = fontPx * 0.62;
  const padX = 9 * sizeScale;
  const sepW = secondary ? fontPx * 1.4 : 0;
  const w = Math.round(
    primary.length * charW + sepW + secondary.length * charW + padX * 2,
  );
  const h = 22 * sizeScale;

  const opacity = dimmed ? 0.35 : 1;
  const emphasis = emphasised ? 1.08 : 1;

  return (
    <g
      transform={`translate(${cx}, ${cy}) scale(${emphasis})`}
      style={{
        transition: "transform 300ms cubic-bezier(0.2, 0.7, 0.2, 1), opacity 220ms ease",
        transformBox: "fill-box",
        transformOrigin: "center",
      }}
      opacity={opacity}
    >
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={3 * sizeScale}
        fill="#19212C"
      />
      <text
        x={0}
        y={fontPx * 0.36}
        fontFamily="Onest, system-ui, sans-serif"
        fontSize={fontPx}
        fontWeight={500}
        letterSpacing="0.08em"
        textAnchor="middle"
      >
        <tspan fill="#FFFFFF">{primary.toUpperCase()}</tspan>
        {secondary && (
          <>
            <tspan dx={sepW * 0.35} fill="rgba(255,255,255,0.55)">
              •
            </tspan>
            <tspan dx={sepW * 0.35} fill="rgba(255,255,255,0.55)">
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
