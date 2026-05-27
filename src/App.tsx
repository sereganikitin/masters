import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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

/**
 * Two rendering modes:
 *
 *  Kiosk (fit-to-viewport 1920×1080 scaled stage — no scroll, all controls visible):
 *    /            — Hero
 *    /genplan     — Genplan
 *    /section/:n  — Section view
 *    /floor/:n/:f — Floor view
 *    /apartment/* — Apartment detail
 *    /tour        — 3D tour iframe
 *
 *  Responsive (regular full-page web layout — vertical scroll, no scaling):
 *    /about       — About project
 *    /catalog     — Apartment catalog with filters
 *    /admin/*     — Admin panel
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Responsive web pages — render outside Stage. */}
        <Route path="/admin/*" element={<AdminScreen />} />
        <Route path="/about" element={<AboutScreen />} />
        <Route path="/catalog" element={<CatalogScreen />} />

        {/* Kiosk screens — wrapped in the 1920×1080 Stage. */}
        <Route
          path="*"
          element={
            <Stage>
              <Routes>
                <Route path="/" element={<HeroScreen />} />
                <Route path="/genplan" element={<GenplanScreen />} />
                <Route path="/section/:sectionNumber" element={<SectionScreen />} />
                <Route path="/floor/:sectionNumber/:floor" element={<FloorScreen />} />
                <Route path="/apartment/:apartmentId" element={<ApartmentScreen />} />
                <Route path="/tour" element={<TourScreen />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Stage>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
