import type { ConstructionEntry } from "@/lib/cms";

export const MONTHS_RU = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

export const monthLabel = (e: { month: number; year: number }) =>
  `${MONTHS_RU[e.month - 1]} ${e.year}`;

// Seed content (Июнь 2026) imported from the developer's project page so the
// dynamics block isn't empty on first run. Merged with DB entries by year+month
// (see withConstructionFallback): it stays visible while admins add other
// months and is overridden only if an admin creates their own Июнь 2026 entry.
export const CONSTRUCTION_FALLBACK: ConstructionEntry[] = [
  {
    id: -202606,
    year: 2026,
    month: 6,
    title: "«Стена в грунте»: ограждение котлована",
    body:
      "На строительной площадке премиального дома подходят к концу работы по ограждению будущего котлована по технологии «стена в грунте» с форшахтой. Параллельно продолжалось возведение «стены в грунте» — бетонного ограждения котлована, выполняющего защитную функцию.",
    bullets: [
      "Выполнено 334 погонных метра «стены в грунте» — 75% от общего объёма.",
      "Завершение основного объёма этапа запланировано на первую декаду июля 2026 года.",
    ],
    photos: [
      "/images/construction/2026-06-1.jpg",
      "/images/construction/2026-06-2.jpg",
      "/images/construction/2026-06-3.jpg",
      "/images/construction/2026-06-4.jpg",
      "/images/construction/2026-06-5.jpg",
    ],
    videoUrl: "",
    sortOrder: 0,
    createdAt: 0,
    updatedAt: 0,
  },
];

/** DB entries win; fallback fills months the admin hasn't created yet. Newest first. */
export function withConstructionFallback(
  items: ConstructionEntry[],
): ConstructionEntry[] {
  const present = new Set(items.map((i) => `${i.year}-${i.month}`));
  return [
    ...items,
    ...CONSTRUCTION_FALLBACK.filter((f) => !present.has(`${f.year}-${f.month}`)),
  ].sort((a, b) => b.year - a.year || b.month - a.month || a.sortOrder - b.sortOrder);
}
