import data from "./apartments.json";
import type { Apartment, Complex, House, RoomType, Section } from "./types";

const complex = data as unknown as Complex;

export function getComplex(): Complex {
  return complex;
}

export function getHouse(): House {
  return complex.houses[0];
}

export function getSection(sectionNumber: number): Section | undefined {
  return getHouse().sections.find((s) => s.number === sectionNumber);
}

export function getFloorApartments(sectionNumber: number, floor: number): Apartment[] {
  const s = getSection(sectionNumber);
  if (!s) return [];
  return s.apartmentsByFloor[floor] ?? [];
}

export function getApartment(id: string): Apartment | undefined {
  for (const s of getHouse().sections) {
    for (const apt of Object.values(s.apartmentsByFloor).flat()) {
      if (apt.id === id) return apt;
    }
  }
  return undefined;
}

export function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    const mln = price / 1_000_000;
    return `${mln.toFixed(1).replace(".", ",")} млн ₽`;
  }
  return `${Math.round(price).toLocaleString("ru-RU")} ₽`;
}

export function formatArea(area: number): string {
  return `${area.toFixed(1).replace(".", ",")} м²`;
}

export const ROOM_TYPES: { key: RoomType; label: string }[] = [
  { key: "studio", label: "Студия" },
  { key: "1", label: "1-к" },
  { key: "2", label: "2-к" },
  { key: "3", label: "3-к" },
  { key: "4+", label: "4-к+" },
];

export function roomTypeLabel(rt: RoomType): string {
  return ROOM_TYPES.find((r) => r.key === rt)?.label ?? rt;
}
