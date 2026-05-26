import type { Apartment } from "@/data/types";

const BASE = "https://plans.capitalgroup.ru/PK2/masters/planirovki";

/**
 * Per-apartment plan image.
 * Pattern: <BASE>/pokvartirnie/c{section}/C{section}_{floor}_{lot}.png
 * Example: /pokvartirnie/c1/C1_2_2.png — section 1, floor 2, lot 2 on floor.
 */
export function apartmentPlanUrl(apt: Apartment): string {
  const section = apt.sectionNumber;
  const floor = apt.floor;
  const lot = apt.lotOnFloor || 1;
  return `${BASE}/pokvartirnie/c${section}/C${section}_${floor}_${lot}.png`;
}

/**
 * Floor plan image.
 * Pattern: <BASE>/poetazhnie/C{section}/C{section}_{floor}.png
 */
export function floorPlanUrl(section: number, floor: number): string {
  return `${BASE}/poetazhnie/C${section}/C${section}_${floor}.png`;
}
