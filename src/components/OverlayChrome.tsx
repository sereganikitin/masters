import { useNavigate } from "react-router-dom";
import { IconClose, IconChevronLeft } from "./Icon";

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
          className="absolute left-10 top-10 z-30 flex h-14 items-center gap-3 rounded-full bg-base-0/90 px-6 text-base-800 backdrop-blur-sm transition-colors hover:bg-base-0"
        >
          <IconChevronLeft size={20} />
          <span className="font-sans text-body font-medium">{backLabel ?? "Назад"}</span>
        </button>
      )}
      <button
        onClick={close}
        className="absolute right-10 top-10 z-30 grid h-14 w-14 place-items-center rounded-full bg-base-0/90 text-base-800 backdrop-blur-sm transition-colors hover:bg-base-0"
        aria-label="Закрыть"
      >
        <IconClose size={22} />
      </button>
    </>
  );
}
