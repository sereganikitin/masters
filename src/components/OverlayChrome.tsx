import { useNavigate } from "react-router-dom";
import { IconChevronLeft } from "./Icon";
import { CloseButton } from "./CloseButton";

interface OverlayChromeProps {
  onClose?: () => void;
  onBack?: () => void;
  backLabel?: string;
}

export function OverlayChrome({ onClose, onBack, backLabel }: OverlayChromeProps) {
  const nav = useNavigate();
  // Default close returns to wherever the overlay was opened from (browser
  // back), falling back to home only when there's no history to pop.
  const close =
    onClose ??
    (() => {
      if (window.history.length > 1) nav(-1);
      else nav("/");
    });

  return (
    <>
      {onBack && (
        <button
          onClick={onBack}
          className="absolute left-10 top-10 z-30 flex h-14 items-center gap-3 rounded-full bg-base-800 px-6 text-base-0 shadow-card transition-colors hover:bg-night-400"
        >
          <IconChevronLeft size={20} />
          <span className="font-sans text-body font-medium">{backLabel ?? "Назад"}</span>
        </button>
      )}
      <CloseButton onClick={close} className="absolute right-10 top-10 z-30" />
    </>
  );
}
