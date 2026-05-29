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
  const close = onClose ?? (() => nav("/"));

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
