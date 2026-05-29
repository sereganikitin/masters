interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  step: number;
  onChange: (v: [number, number]) => void;
  format: (v: number) => string;
  /** Hide the built-in min/max value row above the track. Use when the
   *  parent already shows labelled values (e.g. «от 41,8 / до 137,6»). */
  hideValues?: boolean;
}

/**
 * Touch-friendly dual-handle range slider. Built from two stacked native
 * <input type="range"> elements — browsers handle touch and accessibility
 * for us. The fill between the handles is a separate styled div.
 *
 * Designed for kiosk usage (no keyboard input), so the numeric bounds are
 * shown next to the slider rather than as editable fields.
 */
export function RangeSlider({
  min,
  max,
  value,
  step,
  onChange,
  format,
  hideValues = false,
}: RangeSliderProps) {
  const [lo, hi] = value;
  const range = max - min || 1;
  const loPct = ((lo - min) / range) * 100;
  const hiPct = ((hi - min) / range) * 100;

  return (
    <div className="select-none">
      {!hideValues && (
        <div className="flex items-center justify-between font-sans text-small font-medium text-base-800">
          <span>{format(lo)}</span>
          <span>{format(hi)}</span>
        </div>
      )}

      <div className={`relative h-10 ${hideValues ? "" : "mt-3"}`}>
        {/* Track */}
        <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 bg-base-200" />
        {/* Active range fill */}
        <div
          className="absolute top-1/2 h-[3px] -translate-y-1/2 bg-night-500"
          style={{ left: `${loPct}%`, right: `${100 - hiPct}%` }}
        />

        {/* Low handle */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(e) =>
            onChange([
              Math.min(Math.max(Number(e.target.value), min), hi - step),
              hi,
            ])
          }
          className="range-input absolute inset-0 w-full appearance-none bg-transparent"
          style={{ zIndex: lo > max - range * 0.1 ? 5 : 4 }}
          aria-label="Минимум"
        />
        {/* High handle */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(e) =>
            onChange([
              lo,
              Math.max(Math.min(Number(e.target.value), max), lo + step),
            ])
          }
          className="range-input absolute inset-0 w-full appearance-none bg-transparent"
          style={{ zIndex: 5 }}
          aria-label="Максимум"
        />
      </div>
    </div>
  );
}
