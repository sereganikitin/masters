import { useEffect, useRef, useState } from "react";

export interface EditorOverlay {
  id: number | "draft";
  points: [number, number][];
  color: string;
  label: string;
  selected?: boolean;
}

interface PolygonEditorProps {
  /** Coordinate/viewBox dimensions. Points are stored in this space. */
  coordW: number;
  coordH: number;
  imageSrc?: string;
  overlays: EditorOverlay[];
  draftColor?: string;
  draftPoints: [number, number][] | null;
  onAddPoint: (p: [number, number]) => void;
  onFinishDraft: () => void;
  onCancelDraft: () => void;
  onSelectOverlay: (id: number) => void;
  onMoveVertex: (overlayId: number, vertexIndex: number, p: [number, number]) => void;
  selectedOverlayId: number | null;
}

interface View {
  x: number;
  y: number;
  zoom: number;
}

const DEFAULT_VIEW: View = { x: 0, y: 0, zoom: 1 };
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8;

export function PolygonEditor({
  coordW,
  coordH,
  imageSrc,
  overlays,
  draftColor = "#0061A6",
  draftPoints,
  onAddPoint,
  onFinishDraft,
  onCancelDraft,
  onSelectOverlay,
  onMoveVertex,
  selectedOverlayId,
}: PolygonEditorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<{ overlayId: number; vertex: number } | null>(null);
  const [view, setView] = useState<View>(DEFAULT_VIEW);
  const [panning, setPanning] = useState<{ startX: number; startY: number; startView: View } | null>(null);

  const isDrawing = draftPoints !== null;
  const visW = coordW / view.zoom;
  const visH = coordH / view.zoom;

  // Convert client coordinates to viewBox coordinates accounting for pan + zoom.
  const toCoords = (clientX: number, clientY: number): [number, number] => {
    const svg = svgRef.current;
    if (!svg) return [0, 0];
    const rect = svg.getBoundingClientRect();
    const x = view.x + ((clientX - rect.left) / rect.width) * visW;
    const y = view.y + ((clientY - rect.top) / rect.height) * visH;
    return [Math.round(x), Math.round(y)];
  };

  // Wheel = zoom centred on cursor.
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cursorX = view.x + ((e.clientX - rect.left) / rect.width) * visW;
    const cursorY = view.y + ((e.clientY - rect.top) / rect.height) * visH;
    const factor = e.deltaY > 0 ? 1 / 1.15 : 1.15;
    const nextZoom = clamp(view.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    const nextVisW = coordW / nextZoom;
    const nextVisH = coordH / nextZoom;
    setView({
      zoom: nextZoom,
      x: cursorX - ((e.clientX - rect.left) / rect.width) * nextVisW,
      y: cursorY - ((e.clientY - rect.top) / rect.height) * nextVisH,
    });
  };

  useEffect(() => {
    if (!isDrawing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onFinishDraft();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancelDraft();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDrawing, onFinishDraft, onCancelDraft]);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    if (dragging || panning) return;
    onAddPoint(toCoords(e.clientX, e.clientY));
  };

  const handleSvgDoubleClick = () => {
    if (!isDrawing) return;
    if (draftPoints && draftPoints.length >= 3) onFinishDraft();
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    // Middle button OR shift-drag → pan mode.
    if (e.button === 1 || (e.shiftKey && e.button === 0)) {
      e.preventDefault();
      setPanning({ startX: e.clientX, startY: e.clientY, startView: view });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (panning) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const dx = ((e.clientX - panning.startX) / rect.width) * visW;
      const dy = ((e.clientY - panning.startY) / rect.height) * visH;
      setView({
        ...panning.startView,
        x: panning.startView.x - dx,
        y: panning.startView.y - dy,
      });
      return;
    }
    if (dragging) {
      onMoveVertex(dragging.overlayId, dragging.vertex, toCoords(e.clientX, e.clientY));
    }
  };

  const handlePointerUp = () => {
    setDragging(null);
    setPanning(null);
  };

  // Visual constants in CSS-px space. We divide by zoom so SVG renders them at
  // the same on-screen size regardless of how far we've zoomed into the viewBox.
  const vertexRadius = 8 / view.zoom;
  const strokeBase = 1 / view.zoom;

  const zoomIn = () =>
    setView((v) => ({ ...v, zoom: clamp(v.zoom * 1.25, MIN_ZOOM, MAX_ZOOM) }));
  const zoomOut = () =>
    setView((v) => ({ ...v, zoom: clamp(v.zoom / 1.25, MIN_ZOOM, MAX_ZOOM) }));
  const reset = () => setView(DEFAULT_VIEW);

  return (
    <div className="flex w-full flex-col gap-2">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={zoomOut}
          className="h-9 w-9 border border-base-200 bg-base-0 text-base-800"
          title="Уменьшить"
        >
          −
        </button>
        <span className="min-w-[64px] text-center font-mono text-small text-base-700">
          {Math.round(view.zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={zoomIn}
          className="h-9 w-9 border border-base-200 bg-base-0 text-base-800"
          title="Увеличить"
        >
          +
        </button>
        <button
          type="button"
          onClick={reset}
          className="ml-2 h-9 border border-base-200 bg-base-0 px-3 font-sans text-small text-base-800"
        >
          К исходному
        </button>
        <span className="ml-auto font-sans text-[11px] text-base-600">
          Колесо — зум, Shift+drag — панорама
        </span>
      </div>

      {/* Canvas wrapper — adaptive, fixed aspect ratio. Background and overlays
       * are both rendered inside ONE SVG so zoom/pan are perfectly synchronised. */}
      <div
        ref={wrapperRef}
        className="relative w-full overflow-hidden bg-night-500"
        style={{ aspectRatio: `${coordW} / ${coordH}` }}
        onWheel={onWheel}
      >
        <svg
          ref={svgRef}
          viewBox={`${view.x} ${view.y} ${visW} ${visH}`}
          preserveAspectRatio="none"
          className={`absolute inset-0 h-full w-full ${isDrawing ? "cursor-crosshair" : panning ? "cursor-grabbing" : "cursor-default"}`}
          onClick={handleSvgClick}
          onDoubleClick={handleSvgDoubleClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {imageSrc && (
            <image
              href={imageSrc}
              x={0}
              y={0}
              width={coordW}
              height={coordH}
              preserveAspectRatio="xMidYMid slice"
              style={{ pointerEvents: "none" }}
            />
          )}
          {/* Capture rect — invisible full-coordspace hitbox so clicks always reach onClick. */}
          {(isDrawing || true) && (
            <rect
              x={view.x}
              y={view.y}
              width={visW}
              height={visH}
              fill="transparent"
              style={{ pointerEvents: "all" }}
            />
          )}

          {overlays.map((o) => {
            if (o.id === "draft") return null;
            const isSel = selectedOverlayId === o.id;
            const path = pointsToPath(o.points);
            return (
              <g key={o.id}>
                <path
                  d={path}
                  fill={o.color}
                  fillOpacity={isSel ? 0.35 : 0.18}
                  stroke={o.color}
                  strokeWidth={(isSel ? 2 : 1) * strokeBase}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isDrawing) onSelectOverlay(o.id as number);
                  }}
                  style={{ cursor: isDrawing ? "crosshair" : "pointer" }}
                  vectorEffect="non-scaling-stroke"
                />
                {isSel &&
                  o.points.map((p, i) => (
                    <circle
                      key={i}
                      cx={p[0]}
                      cy={p[1]}
                      r={vertexRadius}
                      fill="#FFFFFF"
                      stroke={o.color}
                      strokeWidth={1.5 * strokeBase}
                      style={{ cursor: "grab" }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setDragging({ overlayId: o.id as number, vertex: i });
                      }}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
              </g>
            );
          })}

          {draftPoints && draftPoints.length > 0 && (
            <g style={{ pointerEvents: "none" }}>
              <path
                d={pointsToPath(draftPoints, false)}
                fill={draftColor}
                fillOpacity={0.18}
                stroke={draftColor}
                strokeWidth={1.5}
                strokeDasharray="6 5"
                vectorEffect="non-scaling-stroke"
              />
              {draftPoints.map((p, i) => (
                <circle
                  key={i}
                  cx={p[0]}
                  cy={p[1]}
                  r={vertexRadius * 0.8}
                  fill={draftColor}
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

function pointsToPath(points: [number, number][], closed: boolean = true): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  const head = `M ${first[0]} ${first[1]}`;
  const body = rest.map((p) => `L ${p[0]} ${p[1]}`).join(" ");
  return closed ? `${head} ${body} Z` : `${head} ${body}`;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}
