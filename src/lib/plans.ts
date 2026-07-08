import type { Apartment } from "@/data/types";

const BASE = "https://plans.capitalgroup.ru/PK2/masters/planirovki";

/**
 * Per-apartment plan image.
 * Pattern: <BASE>/pokvartirnie/c{section}/C{section}_{floor}_{lot}.png
 * Example: /pokvartirnie/c1/C1_11_3.png — section 1, floor 11, on-site lot 3.
 *
 * {lot} is the developer's on-floor position (mcdsoft_number_on_site), which is
 * how CG names the plan files. Our own lotOnFloor index shifts once reserved
 * lots are filtered out, so using it here served the wrong plan (e.g. a studio
 * showing a neighbouring 2-room plan). Fall back to lotOnFloor only if missing.
 */
export function apartmentPlanUrl(apt: Apartment): string {
  const section = apt.sectionNumber;
  const floor = apt.floor;
  const lot = apt.numberOnSite || apt.lotOnFloor || 1;
  return `${BASE}/pokvartirnie/c${section}/C${section}_${floor}_${lot}.png`;
}

/**
 * Floor plan image.
 * Pattern: <BASE>/poetazhnie/C{section}/C{section}_{floor}.png
 */
export function floorPlanUrl(section: number, floor: number): string {
  return `${BASE}/poetazhnie/C${section}/C${section}_${floor}.png`;
}
