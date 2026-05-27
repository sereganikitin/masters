import type { ReactNode } from "react";
import { useStageScale } from "@/lib/useStageScale";
import { useIdleReturn } from "@/lib/useIdleReturn";

export function Stage({ children }: { children: ReactNode }) {
  const ref = useStageScale<HTMLDivElement>();
  useIdleReturn();

  // Outer container scrolls vertically when the scaled stage exceeds viewport
  // height — guarantees access to the bottom UI on short displays.
  return (
    <div
      className="fixed inset-0 overflow-y-auto bg-base-800"
      style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
    >
      <div
        ref={ref}
        className="origin-top-left bg-base-0"
        style={{ width: 1920, height: 1080 }}
      >
        {children}
      </div>
    </div>
  );
}
