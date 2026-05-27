import type { ReactNode } from "react";
import { useStageScale } from "@/lib/useStageScale";
import { useIdleReturn } from "@/lib/useIdleReturn";

/**
 * Kiosk Stage — fixed 1920×1080 surface, fit-scaled to viewport.
 * No scroll: every control stays in view at any window size. Letterbox uses
 * the Imperial Night background so the page reads as a coherent product.
 */
export function Stage({ children }: { children: ReactNode }) {
  const ref = useStageScale<HTMLDivElement>();
  useIdleReturn();

  return (
    <div className="fixed inset-0 overflow-hidden bg-night-500">
      <div
        ref={ref}
        className="origin-top-left bg-base-0"
        style={{ width: 1920, height: 1080, position: "absolute", top: 0, left: 0 }}
      >
        {children}
      </div>
    </div>
  );
}
