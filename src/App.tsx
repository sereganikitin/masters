import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { Stage } from "@/layouts/Stage";
import { HeroScreen } from "@/screens/HeroScreen";
import { AboutScreen } from "@/screens/AboutScreen";
import { CatalogScreen } from "@/screens/CatalogScreen";
import { GenplanScreen } from "@/screens/GenplanScreen";
import { ApartmentScreen } from "@/screens/ApartmentScreen";
import { TourScreen } from "@/screens/TourScreen";
import { AdminScreen } from "@/screens/AdminScreen";
import { ConstructionGalleryScreen } from "@/screens/ConstructionGalleryScreen";

function RedirectSectionToCatalog() {
  const params = useParams<{ sectionNumber?: string }>();
  const n = params.sectionNumber;
  return <Navigate to={n ? `/catalog?section=${n}` : "/catalog"} replace />;
}

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
        <Route path="/about/construction-gallery" element={<ConstructionGalleryScreen />} />
        <Route path="/catalog" element={<CatalogScreen />} />

        {/* Kiosk screens — wrapped in the 1920×1080 Stage. */}
        <Route
          path="*"
          element={
            <Stage>
              <Routes>
                <Route path="/" element={<HeroScreen />} />
                <Route path="/genplan" element={<GenplanScreen />} />
                {/* Old per-section / per-floor pages — redirect into the catalog
                  * with the appropriate filter applied. */}
                <Route
                  path="/section/:sectionNumber"
                  element={<RedirectSectionToCatalog />}
                />
                <Route
                  path="/floor/:sectionNumber/:floor"
                  element={<RedirectSectionToCatalog />}
                />
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
