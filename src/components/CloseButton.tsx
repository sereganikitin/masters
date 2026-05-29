import { Pressable } from "@/components/Pressable";
import { IconClose } from "@/components/Icon";

interface CloseButtonProps {
  onClick: () => void;
  /**
   * Adapts to the surface it's drawn on.
   *   light (default) — white circle, dark icon → use on white pages
   *   dark            — dark circle, white icon → use on Imperial Night kiosk pages
   */
  variant?: "light" | "dark";
  /** Pixel diameter; default 56 (matches the previous h-14 w-14 sizing). */
  size?: number;
  className?: string;
  ariaLabel?: string;
}

/**
 * Unified close (×) button — round, soft drop-shadow, surface-adaptive.
 * Positioning is the parent's responsibility (just add `absolute top-… right-…`
 * via `className`).
 */
export function CloseButton({
  onClick,
  variant = "light",
  size = 56,
  className = "",
  ariaLabel = "Закрыть",
}: CloseButtonProps) {
  const visual =
    variant === "dark"
      ? "bg-base-800 text-base-0 hover:bg-night-400"
      : "bg-base-0 text-base-800 hover:bg-base-100";
  const ripple =
    variant === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.12)";
  return (
    <Pressable
      onClick={onClick}
      rippleColor={ripple}
      className={`grid place-items-center rounded-full shadow-card transition-colors ${visual} ${className}`}
      style={{ width: size, height: size }}
      aria-label={ariaLabel}
    >
      <IconClose size={Math.round(size * 0.4)} />
    </Pressable>
  );
}
