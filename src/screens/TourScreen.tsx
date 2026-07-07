import { OverlayChrome } from "@/components/OverlayChrome";

const TOUR_URL = "https://svl.virtualland.ru/masters/?s=s0p1h120mt1&h=32.17&v=18&fov=110";

export function TourScreen() {
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
      {/* No onClose — OverlayChrome's default returns to the previous page
          (e.g. the About page, at the same scroll position). */}
      <OverlayChrome />
    </div>
  );
}
