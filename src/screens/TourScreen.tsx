import { useNavigate } from "react-router-dom";
import { OverlayChrome } from "@/components/OverlayChrome";

const TOUR_URL = "https://svl.virtualland.ru/masters/?s=s0p1h120mt1&h=32.17&v=18&fov=110";

export function TourScreen() {
  const nav = useNavigate();
  return (
    <div className="relative h-full w-full bg-black">
      <iframe
        src={TOUR_URL}
        title="3D-тур ЖК МАСТЕРС"
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; xr-spatial-tracking; fullscreen"
        allowFullScreen
        loading="lazy"
      />
      <OverlayChrome onClose={() => nav("/")} />
    </div>
  );
}
