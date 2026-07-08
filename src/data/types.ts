export type RoomType = "studio" | "1" | "2" | "3" | "4+";

export interface Apartment {
  id: string;
  code: string;
  number: number;
  roomType: RoomType;
  rooms: number;
  isStudio: boolean;
  area: number;
  livingArea: number;
  price: number;
  pricePerMeter: number;
  floor: number;
  sectionNumber: number;
  buildingNumber: number;
  decoration: string;
  status: string;
  /** Developer's position number on the floor (mcdsoft_number_on_site). This is
   * what the CG plan asset filenames are keyed by — use it for the plan URL. */
  numberOnSite: number;
  /** Our own 1-based index among available lots on the floor. Kept as a plan
   * fallback only when numberOnSite is missing. */
  lotOnFloor: number;
  features: {
    cornerGlazing: boolean;
    largeKitchenLivingRoom: boolean;
    masterBedroom: boolean;
    balconyCount: number;
    loggiaCount: number;
  };
}

export interface Section {
  id: string;
  code: string;
  number: number;
  primaryFloor: number;
  highFloor: number;
  storeysRange: string;
  apartmentCount: number;
  byRoomType: Record<RoomType, { count: number; minPrice: number; minArea: number }>;
  apartmentsByFloor: Record<number, Apartment[]>;
}

export interface House {
  id: string;
  number: string;
  storeysRange: string;
  highFloor: number;
  contourSvgPath: string;
  startDate: string;
  endDate: string;
  category: string;
  sections: Section[];
}

export interface Complex {
  id: string;
  name: string;
  region: string;
  town: string;
  metro: string;
  houses: House[];
  totals: {
    apartmentCount: number;
    byRoomType: Record<RoomType, { count: number; minPrice: number; minArea: number }>;
  };
}
