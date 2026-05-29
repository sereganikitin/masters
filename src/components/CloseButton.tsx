import { Pressable } from "@/components/Pressable";
import { IconClose } from "@/components/Icon";

interface CloseButtonProps {
  onClick: () => void;
  /** Pixel diameter; default 56 (matches the previous h-14 w-14 sizing). */
  size?: number;
  className?: string;
  ariaLabel?: string;
}

/**
 * Unified close (×) button — round white surface, dark icon, soft drop-shadow.
 * Works on light and dark backgrounds: the shadow lifts it from any colour,
 * and the white fill keeps the X consistent across the site.
 * Positioning is the parent's responsibility (add `absolute top-… right-…`
 * via `className`).
 */
export function CloseButton({
  onClick,
  size = 56,
  className = "",
  ariaLabel = "Закрыть",
}: CloseButtonProps) {
  return (
    <Pressable
      onClick={onClick}
      rippleColor="rgba(0,0,0,0.12)"
      className={`grid place-items-center rounded-full bg-base-0 text-base-800 shadow-card transition-colors hover:bg-base-100 ${className}`}
      style={{ width: size, height: size }}
      aria-label={ariaLabel}
    >
      <IconClose size={Math.round(size * 0.4)} />
    </Pressable>
  );
}
