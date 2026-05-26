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
  /** Position of this apartment on its floor (1-based). Used to build plan URL. */
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
