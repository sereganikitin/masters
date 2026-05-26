import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { Stage } from "@/layouts/Stage";
import { HeroScreen } from "@/screens/HeroScreen";
import { AboutScreen } from "@/screens/AboutScreen";
import { CatalogScreen } from "@/screens/CatalogScreen";
import { GenplanScreen } from "@/screens/GenplanScreen";
import { SectionScreen } from "@/screens/SectionScreen";
import { FloorScreen } from "@/screens/FloorScreen";
import { ApartmentScreen } from "@/screens/ApartmentScreen";
import { TourScreen } from "@/screens/TourScreen";
import { AdminScreen } from "@/screens/AdminScreen";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin lives outside the kiosk Stage — uses real viewport for desktop editing */}
        <Route path="/admin/*" element={<AdminScreen />} />

        {/* Everything else runs inside the fixed 1920x1080 Stage */}
        <Route
          path="*"
          element={
            <KioskLayout>
              <KioskRoutes />
            </KioskLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function KioskLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  // Hide stage chrome when navigating to admin (defensive — handled by outer Routes).
  if (pathname.startsWith("/admin")) return <>{children}</>;
  return <Stage>{children}</Stage>;
}

function KioskRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HeroScreen />} />
      <Route path="/about" element={<AboutScreen />} />
      <Route path="/catalog" element={<CatalogScreen />} />
      <Route path="/genplan" element={<GenplanScreen />} />
      <Route path="/section/:sectionNumber" element={<SectionScreen />} />
      <Route path="/floor/:sectionNumber/:floor" element={<FloorScreen />} />
      <Route path="/apartment/:apartmentId" element={<ApartmentScreen />} />
      <Route path="/tour" element={<TourScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
