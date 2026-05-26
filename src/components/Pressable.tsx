import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
  useCallback,
} from "react";

interface PressableProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  rippleColor?: string;
}

/**
 * Touch-friendly button with subtle press scale + a light ripple wave.
 * The ripple is anchored to the touch/click position.
 */
export const Pressable = forwardRef<HTMLButtonElement, PressableProps>(function Pressable(
  { children, className = "", rippleColor = "rgba(255,255,255,0.35)", onPointerDown, ...rest },
  ref,
) {
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      const ripple = document.createElement("span");
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      ripple.className = "ripple";
      ripple.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${rippleColor};`;
      target.appendChild(ripple);
      const cleanup = () => {
        ripple.remove();
        ripple.removeEventListener("animationend", cleanup);
      };
      ripple.addEventListener("animationend", cleanup);
      onPointerDown?.(e);
    },
    [onPointerDown, rippleColor],
  );

  return (
    <button
      ref={ref}
      onPointerDown={handlePointerDown}
      className={`tap-surface ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});
