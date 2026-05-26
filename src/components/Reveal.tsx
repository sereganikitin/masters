import type { CSSProperties, ReactNode } from "react";
import { useReveal } from "@/lib/useReveal";

type RevealMode = "up" | "down" | "left" | "right" | "fade" | "zoom";

interface RevealProps {
  children: ReactNode;
  mode?: RevealMode;
  delay?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
  /** Distance in pixels for slide modes */
  distance?: number;
}

const TRANSFORM: Record<RevealMode, string> = {
  up: "translate3d(0, var(--rd, 32px), 0)",
  down: "translate3d(0, calc(var(--rd, 32px) * -1), 0)",
  left: "translate3d(var(--rd, 32px), 0, 0)",
  right: "translate3d(calc(var(--rd, 32px) * -1), 0, 0)",
  fade: "translate3d(0, 0, 0)",
  zoom: "scale(0.96)",
};

export function Reveal({
  children,
  mode = "up",
  delay = 0,
  duration = 700,
  distance = 32,
  className = "",
  style,
}: RevealProps) {
  const { ref, visible } = useReveal<HTMLDivElement>();

  const baseStyle: CSSProperties = {
    transform: visible ? "translate3d(0, 0, 0) scale(1)" : TRANSFORM[mode],
    opacity: visible ? 1 : 0,
    transition: `transform ${duration}ms cubic-bezier(0.2, 0.7, 0.2, 1) ${delay}ms, opacity ${duration}ms ease ${delay}ms`,
    willChange: "transform, opacity",
    "--rd": `${distance}px`,
    ...style,
  } as CSSProperties;

  return (
    <div ref={ref} className={className} style={baseStyle}>
      {children}
    </div>
  );
}
