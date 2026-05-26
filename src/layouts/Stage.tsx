import type { ReactNode } from "react";
import { useStageScale } from "@/lib/useStageScale";
import { useIdleReturn } from "@/lib/useIdleReturn";

export function Stage({ children }: { children: ReactNode }) {
  const ref = useStageScale<HTMLDivElement>();
  useIdleReturn();

  return (
    <div className="fixed inset-0 bg-base-800">
      <div
        ref={ref}
        className="stage origin-top-left bg-base-0"
        style={{ width: 1920, height: 1080 }}
      >
        {children}
      </div>
    </div>
  );
}
