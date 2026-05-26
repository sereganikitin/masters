import { XMLParser } from "fast-xml-parser";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { Apartment, Complex, House, RoomType, Section } from "../src/data/types";

const FEED_URL =
  "https://pics.capitalgroup.ru/pic/%D0%91%D0%BE%D0%B9/%D0%A0%D0%9A_%D0%A1%D0%B0%D0%B9%D1%82_%D0%92%D0%B8%D0%BA%D1%82%D0%BE%D1%80%D0%B5%D0%BD%D0%BA%D0%BE.xml";

const ROOT = path.resolve(import.meta.dirname, "..");
const RAW_XML = path.join(ROOT, "data", "feed.xml");
const OUT_JSON = path.join(ROOT, "src", "data", "apartments.json");

function parseRu(num: string | number | undefined): number {
  if (num === undefined || num === null) return 0;
  if (typeof num === "number") return num;
  const cleaned = String(num).replace(/\s/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function toRoomType(rooms: number, isStudio: boolean): RoomType {
  if (isStudio) return "studio";
  if (rooms <= 1) return "1";
  if (rooms === 2) return "2";
  if (rooms === 3) return "3";
  return "4+";
}

function toBool(v: unknown): boolean {
  return v === true || v === "true" || v === "True";
}

function arr<T>(v: T | T[] | undefined): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

async function fetchFeed(): Promise<string> {
  if (existsSync(RAW_XML) && process.env.FORCE_REFETCH !== "1") {
    console.log(`Using cached feed: ${RAW_XML}`);
    return readFile(RAW_XML, "utf8");
  }
  console.log(`Fetching feed: ${FEED_URL}`);
  const res = await fetch(FEED_URL);
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status} ${res.statusText}`);
  const xml = await res.text();
  await mkdir(path.dirname(RAW_XML), { recursive: true });
  await writeFile(RAW_XML, xml, "utf8");
  console.log(`Cached: ${RAW_XML} (${xml.length} bytes)`);
  return xml;
}

interface RoomTypeStats {
  count: number;
  minPrice: number;
  minArea: number;
}

function emptyStats(): Record<RoomType, RoomTypeStats> {
  return {
    studio: { count: 0, minPrice: 0, minArea: 0 },
    "1": { count: 0, minPrice: 0, minArea: 0 },
    "2": { count: 0, minPrice: 0, minArea: 0 },
    "3": { count: 0, minPrice: 0, minArea: 0 },
    "4+": { count: 0, minPrice: 0, minArea: 0 },
  };
}

function accumulate(stats: Record<RoomType, RoomTypeStats>, a: Apartment) {
  const s = stats[a.roomType];
  s.count += 1;
  if (s.minPrice === 0 || a.price < s.minPrice) s.minPrice = a.price;
  if (s.minArea === 0 || a.area < s.minArea) s.minArea = a.area;
}

function transformProperty(raw: Record<string, unknown>): Apartment {
  const rooms = parseRu(raw.mcdsoft_number_rooms as string);
  const isStudio = toBool(raw.mcdsoft_isstudio);
  return {
    id: String(raw.mcdsoft_propertyid ?? ""),
    code: String(raw.mcdsoft_code ?? ""),
    number: parseRu(raw.mcdsoft_relevant_number as string) || parseRu(raw.mcdsoft_number_on_site as string),
    roomType: toRoomType(rooms, isStudio),
    rooms,
    isStudio,
    area: parseRu(raw.mcdsoft_whole_project_area as string),
    livingArea: parseRu(raw.mcdsoft_living_project_area as string),
    price: parseRu(raw.mcdsoft_price as string),
    pricePerMeter: parseRu(raw.mcdsoft_price_meter as string),
    floor: parseRu(raw.mcdsoft_floor_height as string),
    sectionNumber: parseRu(raw.mcdsoft_section_number as string),
    buildingNumber: parseRu(raw.mcdsoft_section_buildnumber as string),
    decoration: String(raw.mcdsoft_decoration ?? ""),
    status: String(raw.mcdsoft_status_chessmatches ?? ""),
    lotOnFloor: 0, // assigned after grouping by floor
    features: {
      cornerGlazing: toBool(raw.cg_corner_glazing),
      largeKitchenLivingRoom: toBool(raw.cg_large_kitchen_living_room),
      masterBedroom: toBool(raw.cg_master_bedroom),
      balconyCount: parseRu(raw.mcdsoft_balcony_count as string),
      loggiaCount: parseRu(raw.mcdsoft_loggia_count as string),
    },
  };
}

function transformSection(raw: Record<string, unknown>): Section {
  const apartments = arr(raw.mcdsoft_property as Record<string, unknown> | Record<string, unknown>[]).map(
    transformProperty,
  );
  const stats = emptyStats();
  const byFloor: Record<number, Apartment[]> = {};
  for (const apt of apartments) {
    accumulate(stats, apt);
    if (!byFloor[apt.floor]) byFloor[apt.floor] = [];
    byFloor[apt.floor].push(apt);
  }
  // Assign lotOnFloor: sort apartments on each floor by their numeric "number" and assign 1-based index.
  for (const floor of Object.keys(byFloor)) {
    const list = byFloor[Number(floor)];
    list.sort((a, b) => a.number - b.number);
    list.forEach((apt, idx) => {
      apt.lotOnFloor = idx + 1;
    });
  }
  return {
    id: String(raw.mcdsoft_sectionid ?? ""),
    code: String(raw.mcdsoft_code ?? ""),
    number: parseRu(raw.mcdsoft_number as string),
    primaryFloor: parseRu(raw.mcdsoft_primary_floor as string),
    highFloor: parseRu(raw.mcdsoft_high_floor as string),
    storeysRange: String(raw.mcdsoft_number_storeys ?? ""),
    apartmentCount: apartments.length,
    byRoomType: stats,
    apartmentsByFloor: byFloor,
  };
}

function transformHouse(raw: Record<string, unknown>): House {
  const sections = arr(raw.mcdsoft_section as Record<string, unknown> | Record<string, unknown>[]).map(
    transformSection,
  );
  return {
    id: String(raw.mcdsoft_houseid ?? ""),
    number: String(raw.mcdsoft_number ?? ""),
    storeysRange: String(raw.mcdsoft_number_storeys ?? ""),
    highFloor: parseRu(raw.mcdsoft_high_floor as string),
    contourSvgPath: String(raw.mcdsoft_contour_object ?? ""),
    startDate: String(raw.mcdsoft_start_date ?? ""),
    endDate: String(raw.mcdsoft_end_date ?? ""),
    category: String(raw.mcdsoft_category_property ?? ""),
    sections,
  };
}

function transformComplex(raw: Record<string, unknown>): Complex {
  const houses = arr(raw.mcdsoft_house as Record<string, unknown> | Record<string, unknown>[]).map(transformHouse);
  const totals = emptyStats();
  let total = 0;
  for (const h of houses) {
    for (const s of h.sections) {
      total += s.apartmentCount;
      for (const apt of Object.values(s.apartmentsByFloor).flat()) {
        accumulate(totals, apt);
      }
    }
  }
  return {
    id: String(raw.mcdsoft_apartment_complexid ?? ""),
    name: String(raw.mcdsoft_apartment_complex_name ?? "").trim(),
    region: String(raw.mcdsoft_region_name ?? "").trim(),
    town: String((houses[0] as House | undefined)?.id ? raw.mcdsoft_house : ""), // not used
    metro: String((raw.mcdsoft_house as Record<string, unknown> | undefined)?.mcdsoft_metro_name ?? ""),
    houses,
    totals: { apartmentCount: total, byRoomType: totals },
  };
}

async function main() {
  const xml = await fetchFeed();
  const parser = new XMLParser({
    ignoreAttributes: true,
    trimValues: true,
    parseTagValue: false,
    parseAttributeValue: false,
  });
  const doc = parser.parse(xml) as { mcdsoft_feed: { mcdsoft_apartment_complex: Record<string, unknown> } };
  const complexRaw = doc.mcdsoft_feed.mcdsoft_apartment_complex;
  const complex = transformComplex(complexRaw);
  await mkdir(path.dirname(OUT_JSON), { recursive: true });
  await writeFile(OUT_JSON, JSON.stringify(complex), "utf8");
  const size = (await readFile(OUT_JSON)).length;
  console.log("--- Build summary ---");
  console.log(`Complex: ${complex.name} (${complex.region})`);
  console.log(`Houses: ${complex.houses.length}`);
  for (const h of complex.houses) {
    console.log(`  House ${h.number}: ${h.sections.length} sections, ${h.sections.reduce((n, s) => n + s.apartmentCount, 0)} apartments`);
  }
  console.log(`Total apartments: ${complex.totals.apartmentCount}`);
  console.log(`By room type:`);
  for (const [rt, st] of Object.entries(complex.totals.byRoomType)) {
    if (st.count > 0) console.log(`  ${rt.padEnd(7)} ${String(st.count).padStart(4)} from ${st.minPrice.toLocaleString("ru-RU")} ₽, from ${st.minArea} м²`);
  }
  console.log(`Output: ${OUT_JSON} (${size} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
