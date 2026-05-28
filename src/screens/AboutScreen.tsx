import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Reveal } from "@/components/Reveal";
import { Pressable } from "@/components/Pressable";
import { PlanImage } from "@/components/PlanImage";
import { GenplanCanvas } from "@/components/GenplanCanvas";
import { AboutMenu } from "@/components/AboutMenu";
import { getHouse, formatArea, formatPrice, ROOM_TYPES } from "@/data/complex";
import { apartmentPlanUrl } from "@/lib/plans";
import type { Apartment, RoomType } from "@/data/types";
import {
  IconClose,
  IconArrowRight,
  IconPhone,
  IconPlay,
} from "@/components/Icon";
import { useContent } from "@/lib/useContent";
import { specialFormatsApi, type SpecialFormat } from "@/lib/cms";
import {
  ABOUT_CONSTRUCTION_DEFAULTS,
  ABOUT_DOCUMENTS_DEFAULTS,
  ABOUT_ENGINEERING_DEFAULTS,
  ABOUT_HERO_DEFAULTS,
  ABOUT_OFFICE_DEFAULTS,
  ABOUT_TOUR_DEFAULTS,
  SITE_HEADER_DEFAULTS,
  type CtaTile as CtaTileType,
} from "@/lib/cmsTypes";

// About page modelled on cg-projects.ru/about. Verbatim copy & section flow
// per Figma frame 14057:31658. All section titles are huge UPPERCASE.

export function AboutScreen() {
  const nav = useNavigate();
  return (
    <div className="relative h-full w-full overflow-hidden bg-base-0 text-base-800">
      <Pressable
        onClick={() => nav("/")}
        rippleColor="rgba(0,0,0,0.12)"
        className="absolute right-9 top-9 z-50 grid h-14 w-14 place-items-center bg-base-0 text-base-800 shadow-card"
        aria-label="Закрыть"
      >
        <IconClose size={22} />
      </Pressable>

      <div
        className="h-full w-full overflow-y-auto"
        style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
      >
        <PageHeader />
        <Hero />
        <Genplan />
        <Tour3d />
        <SpecialFormats />
        <Layouts />
        <Engineering />
        <Construction />
        <Office />
        <Documents />
        <PageFooter />
      </div>

      <AboutMenu />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout primitives
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_PAD = "px-20"; // 80px gutter on 1920 stage

function PrimaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Pressable
      onClick={onClick}
      rippleColor="rgba(255,255,255,0.25)"
      className="flex h-14 w-fit items-center gap-3 bg-accent px-7 font-sans text-body font-medium text-base-0"
    >
      {children}
      <IconArrowRight size={18} />
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Header
// ─────────────────────────────────────────────────────────────────────────────

function PageHeader() {
  const nav = useNavigate();
  const header = useContent("site.header", SITE_HEADER_DEFAULTS);
  const navigate = (href: string) => {
    if (!href || href === "#") return;
    if (href.startsWith("/")) nav(href);
    else window.open(href, "_blank", "noopener,noreferrer");
  };
  return (
    <header
      className={`flex items-center justify-between border-b border-base-200 bg-base-0 ${PAGE_PAD} py-6`}
    >
      <button onClick={() => nav("/")} className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center bg-base-800 text-base-0">
          <span className="font-display text-[14px] font-bold leading-none">
            {header.brandLine}
          </span>
        </div>
        <span className="font-display text-[14px] font-medium uppercase tracking-[0.25em] text-base-800">
          {header.brand}
        </span>
      </button>

      <nav className="flex items-center gap-12 font-sans text-body font-medium text-base-800">
        {header.menuItems.map((mi) => (
          <button
            key={mi.label}
            onClick={() => navigate(mi.href)}
            className="transition-opacity hover:opacity-60"
          >
            {mi.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-8 font-sans text-body font-medium text-base-800">
        <a href={header.phoneHref || "#"} className="tracking-wide">
          {header.phone}
        </a>
        <button className="flex items-center gap-2 transition-opacity hover:opacity-60">
          <IconPhone size={18} />
          Войти
        </button>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Hero — split с метаданными слева и фото справа
// ─────────────────────────────────────────────────────────────────────────────

function Hero() {
  const c = useContent("about.hero", ABOUT_HERO_DEFAULTS);
  const titleLines = c.title.split("\n");
  return (
    <section id="hero" className={`${PAGE_PAD} py-24`}>
      <div className="grid grid-cols-2 gap-16">
        <div>
          <Reveal mode="up">
            <h1 className="font-display text-[36px] font-bold uppercase leading-[1.1] tracking-[-0.02em] text-base-800">
              {titleLines.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < titleLines.length - 1 && <br />}
                </span>
              ))}
            </h1>
          </Reveal>

          <Reveal mode="up" delay={120}>
            <dl className="mt-16 divide-y divide-base-200 border-t border-base-200">
              {c.metaRows.map((row, i) => (
                <MetaRow key={i} label={row.label} dim={row.dim}>
                  {row.value}
                </MetaRow>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal mode="up" delay={200}>
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-base-100">
            <img
              src={c.photo}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />

            {(() => {
              // Render only tiles that have a URL — clearing the URL field in
              // admin is the same as hiding the tile.
              const visibleTiles = c.ctaTiles.filter(
                (t) => t.url.trim().length > 0,
              );
              if (visibleTiles.length === 0) return null;
              return (
                <div className="absolute bottom-0 right-0 z-10 flex w-[300px] flex-col">
                  {visibleTiles.map((tile, i) => (
                    <CtaTile key={i} tile={tile} />
                  ))}
                </div>
              );
            })()}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function MetaRow({
  label,
  children,
  dim = false,
}: {
  label: string;
  children: React.ReactNode;
  dim?: boolean;
}) {
  return (
    <div className="grid grid-cols-[200px_1fr] gap-8 py-5">
      <dt className="font-sans text-small text-base-600">{label}</dt>
      <dd
        className={`font-sans text-body font-medium leading-relaxed ${dim ? "text-base-200" : "text-base-800"}`}
      >
        {children}
      </dd>
    </div>
  );
}

function CtaTile({ tile }: { tile: CtaTileType }) {
  const onClick = () => {
    if (!tile.url) return;
    if (tile.url.startsWith("/")) window.location.href = tile.url;
    else window.open(tile.url, "_blank", "noopener,noreferrer");
  };

  const text = (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="truncate font-sans text-[14px] font-medium tracking-[-0.006em] text-base-800">
        {tile.title}
      </p>
      <p className="truncate font-sans text-[12px] tracking-[-0.004em] text-base-600">
        {tile.sub}
      </p>
    </div>
  );

  // Figma reference: «play» tile keeps a thumbnail-style light icon block on
  // the LEFT; «arrow» tile has a dark Imperial Night icon block on the RIGHT
  // with an external-link glyph, text aligned left.
  if (tile.icon === "play") {
    return (
      <Pressable
        onClick={onClick}
        rippleColor="rgba(0,0,0,0.08)"
        className="flex w-full items-center gap-3 border-b border-base-200 bg-base-0 py-2 pl-2 pr-4 text-left last:border-b-0"
      >
        <div className="grid h-14 w-14 flex-shrink-0 place-items-center bg-base-100 text-base-800">
          <IconPlay size={20} />
        </div>
        {text}
      </Pressable>
    );
  }

  return (
    <Pressable
      onClick={onClick}
      rippleColor="rgba(0,0,0,0.08)"
      className="flex w-full items-center gap-3 border-b border-base-200 bg-base-0 py-2 pl-4 pr-2 text-left last:border-b-0"
    >
      {text}
      <div className="grid h-14 w-14 flex-shrink-0 place-items-center bg-night-500 text-base-0">
        {/* External-link icon (square with arrow exiting top-right) */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M11 4h5v5" />
          <path d="M16 4l-7 7" />
          <path d="M5 7v8a1 1 0 001 1h8" />
        </svg>
      </div>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Генплан проекта — full-width section on dark background
// ─────────────────────────────────────────────────────────────────────────────

function Genplan() {
  const nav = useNavigate();
  return (
    <section id="genplan" className="relative w-full bg-base-0 text-base-800">
      <div className={`${PAGE_PAD} pb-16 pt-24`}>
        <Reveal mode="up">
          <h2 className="border-t border-base-800 pt-6 font-display text-[64px] font-semibold uppercase leading-[1.1] tracking-[-0.02em] text-base-800">
            Генплан проекта
          </h2>
        </Reveal>
      </div>

      {/* Same aerial + section chips as the interactive /genplan, but here
        * sections are NOT clickable and admin overlays are NOT shown.
        * Surrounding POI labels (Викторенко, Авиапарк, школа, парк…) are added. */}
      <div
        className="relative w-full overflow-hidden bg-night-500"
        style={{ aspectRatio: "1920 / 1080" }}
      >
        <GenplanCanvas
          showOverlays={false}
          showPOI
          sectionsOffsetY={150}
          poiOffsetY={50}
          sectionOffsets={{
            1: [55, -50],
            2: [-10, -50],
            3: [10, 20],
            4: [30, 0],
            5: [120, 20],
            6: [-30, 0],
            7: [-50, 0],
            8: [-50, 10],
            9: [-80, -10],
            10: [-40, -20],
            11: [0, -100],
          }}
        />

        {/* Bottom CTA — full kiosk view */}
        <div className="absolute bottom-10 right-10 z-20">
          <PrimaryButton onClick={() => nav("/genplan")}>
            Открыть полный генплан
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. 3D-тур — короткая секция с thumbnail справа
// ─────────────────────────────────────────────────────────────────────────────

function Tour3d() {
  const nav = useNavigate();
  const c = useContent("about.tour", ABOUT_TOUR_DEFAULTS);
  const handleCta = () => {
    if (!c.ctaUrl) return;
    if (c.ctaUrl.startsWith("/")) nav(c.ctaUrl);
    else window.open(c.ctaUrl, "_blank", "noopener,noreferrer");
  };
  return (
    <section id="tour" className={`${PAGE_PAD} py-24`}>
      <div className="grid grid-cols-[280px_1fr_280px] items-start gap-12">
        <Reveal mode="up">
          <p className="flex items-center gap-3 font-display text-upper font-extrabold uppercase tracking-[-0.02em] text-base-800">
            <span className="inline-block h-2.5 w-2.5 bg-base-800" />
            {c.eyebrow}
          </p>
        </Reveal>

        <Reveal mode="up" delay={120}>
          <div className="mx-auto max-w-[640px]">
            <div className="font-sans text-body leading-relaxed text-base-800">
              <div className="float-left mr-5 mt-1 h-[110px] w-[110px] overflow-hidden bg-base-100">
                {c.thumbImage && (
                  <img
                    src={c.thumbImage}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              {c.paragraphs.map((p, i) => (
                <p key={i} className={i > 0 ? "mt-6" : undefined}>
                  {p}
                </p>
              ))}
            </div>

            <div className="mt-12 flex justify-center">
              <Pressable
                onClick={handleCta}
                rippleColor="rgba(255,255,255,0.18)"
                className="flex h-14 items-center gap-5 bg-night-500 px-7 font-sans text-body font-medium text-base-0"
              >
                {c.ctaLabel}
                <span className="h-px w-5 bg-base-0/40" />
                <IconArrowRight size={18} />
              </Pressable>
            </div>
          </div>
        </Reveal>

        <div />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Особые форматы — 3 карточки с фото
// ─────────────────────────────────────────────────────────────────────────────

const FORMATS_FALLBACK: { tag: string; title: string; body: string; image: string; detailsUrl?: string }[] = [
  {
    tag: "01",
    title: "Собственные террасы",
    body:
      "Ваша личная открытая гостиная под небом Москвы. Место для утреннего кофе, вечерних встреч и созерцания города в любое время года.",
    image: "/images/about/format-01-terrace.png",
  },
  {
    tag: "02",
    title: "Ванные с окном",
    body:
      "Здесь утро начинается с мягкого естественного света. Продуманная планировка позволяет разместить окно так, чтобы оно освещало комнату, сохраняя при этом полную приватность.",
    image: "/images/about/format-02-window-bath.png",
  },
  {
    tag: "03",
    title: "Квартиры с одиннадцатью окнами",
    body:
      "Просторная трехкомнатная квартира с одиннадцатью окнами наполнена светом и воздухом. Энергоэффективное остекление и усиленная звукоизоляция сохраняют комфортный микроклимат, тишину и приватность.",
    image: "/images/about/format-03-eleven-windows.png",
  },
];

const FORMATS_VISIBLE = 3;

function SpecialFormats() {
  const [items, setItems] = useState<SpecialFormat[] | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    specialFormatsApi
      .list()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  // Use CMS items if any, otherwise fall back to hardcoded defaults so the
  // page is never empty during first-run with no admin content.
  const resolved =
    items && items.length > 0
      ? items.map((it) => ({
          tag: it.tag,
          title: it.title,
          body: it.body,
          image: it.image,
          detailsUrl: it.detailsUrl,
        }))
      : FORMATS_FALLBACK;

  const display = showAll ? resolved : resolved.slice(0, FORMATS_VISIBLE);
  const hiddenCount = Math.max(0, resolved.length - FORMATS_VISIBLE);
  return (
    <section id="special-formats" className={`${PAGE_PAD} pb-24 pt-24`}>
      <Reveal mode="up">
        <h2 className="border-b border-base-800 pb-6 font-display text-[64px] font-semibold uppercase leading-[1.1] tracking-[-0.02em] text-base-800">
          Особые форматы
        </h2>
      </Reveal>

      <div>
        {display.map((it, i) => (
          <Reveal key={`${it.tag}-${i}`} mode="up" delay={i * 100}>
            <article className="grid grid-cols-[180px_1fr_560px] items-stretch gap-12 border-b border-base-200 py-12">
              {/* Left — marker + number */}
              <div className="flex items-start gap-3 pt-1 font-display text-upper font-extrabold uppercase tracking-[-0.02em] text-base-800">
                <span className="mt-[3px] inline-block h-2.5 w-2.5 bg-base-800" />
                {it.tag}
              </div>

              {/* Middle — title at top, body + link at bottom */}
              <div className="flex flex-col">
                <h3 className="font-display text-[24px] font-bold uppercase leading-[1.1] tracking-[-0.02em] text-base-800">
                  {it.title}
                </h3>
                <div className="mt-auto pt-24">
                  <p className="font-sans text-body leading-relaxed text-base-700">
                    {it.body}
                  </p>
                  {it.detailsUrl ? (
                    <a
                      href={it.detailsUrl}
                      target={it.detailsUrl.startsWith("/") ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      className="mt-6 flex items-center gap-2 self-start font-sans text-body font-medium text-base-800 transition-opacity hover:opacity-60"
                    >
                      <span className="border-b border-base-800 pb-0.5">Подробнее</span>
                      <IconArrowRight size={16} />
                    </a>
                  ) : (
                    <button className="mt-6 flex items-center gap-2 self-start font-sans text-body font-medium text-base-800 transition-opacity hover:opacity-60">
                      <span className="border-b border-base-800 pb-0.5">Подробнее</span>
                      <IconArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Right — photo */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-base-100">
                {it.image && (
                  <img
                    src={it.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 hover:scale-[1.04]"
                  />
                )}
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      {hiddenCount > 0 && !showAll && (
        <Reveal mode="up" delay={200}>
          <div className="mt-12 flex justify-center gap-1">
            <Pressable
              onClick={() => setShowAll(true)}
              rippleColor="rgba(255,255,255,0.18)"
              className="flex h-12 items-center bg-night-500 px-6 font-sans text-body font-medium text-base-0"
            >
              Показать ещё {hiddenCount}
            </Pressable>
            <Pressable
              rippleColor="rgba(255,255,255,0.18)"
              className="grid h-12 w-12 place-items-center bg-night-500 text-base-0"
              aria-label="Ещё"
            >
              <span className="flex gap-1">
                <span className="h-1 w-1 rounded-full bg-base-0" />
                <span className="h-1 w-1 rounded-full bg-base-0" />
                <span className="h-1 w-1 rounded-full bg-base-0" />
              </span>
            </Pressable>
          </div>
        </Reveal>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Планировки — превью карточки
// ─────────────────────────────────────────────────────────────────────────────

function Layouts() {
  const nav = useNavigate();
  const house = getHouse();
  const allApartments = useMemo<Apartment[]>(
    () => house.sections.flatMap((s) => Object.values(s.apartmentsByFloor).flat()),
    [house],
  );

  // Show ALL room types in the filter; disable those that have no matching apartments
  // in the feed (they'll come online later).
  const roomCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of allApartments) map[a.roomType] = (map[a.roomType] ?? 0) + 1;
    return map;
  }, [allApartments]);

  // Highest floor across all sections — used for "Этаж X/N" denominator.
  const topFloor = useMemo(
    () => house.sections.reduce((m, s) => Math.max(m, s.highFloor ?? 0), 0),
    [house],
  );

  // Initial selection — first available type, falls back to first listed.
  const firstAvailable = ROOM_TYPES.find((rt) => (roomCounts[rt.key] ?? 0) > 0);
  const [room, setRoom] = useState<RoomType>(firstAvailable?.key ?? "1");
  const [index, setIndex] = useState(0);

  // All apartments of the selected room type. The carousel cycles through them.
  const matching = useMemo(
    () => allApartments.filter((a) => a.roomType === room),
    [allApartments, room],
  );
  const total = matching.length;
  const sample = matching[index] ?? matching[0];

  const pickRoom = (rt: RoomType) => {
    setRoom(rt);
    setIndex(0);
  };
  const prev = () => total && setIndex((i) => (i - 1 + total) % total);
  const next = () => total && setIndex((i) => (i + 1) % total);

  const range = (vals: number[]) => {
    if (vals.length === 0) return [0, 0] as [number, number];
    return [Math.min(...vals), Math.max(...vals)] as [number, number];
  };
  const [minArea, maxArea] = range(matching.map((a) => a.area));
  const [minPrice, maxPrice] = range(matching.map((a) => a.price));
  const headingMap: Record<RoomType, string> = {
    studio: "Студий",
    "1": "1-комн. квартир",
    "2": "2-комн. квартир",
    "3": "3-комн. квартир",
    "4+": "4-комн. квартир",
  };

  // Tag chips — first one shown solid, rest dimmed, with "+N" overflow.
  const tags: string[] = [];
  if (sample?.decoration) tags.push(sample.decoration);
  if (sample?.features.largeKitchenLivingRoom) tags.push("Кухня-гостиная");
  if (sample?.features.masterBedroom) tags.push("Мастер-спальня");
  if (sample?.features.cornerGlazing) tags.push("Угловое остекление");
  if ((sample?.features.balconyCount ?? 0) > 0) tags.push("Балкон");
  if ((sample?.features.loggiaCount ?? 0) > 0) tags.push("Лоджия");
  // Static placeholder until we get real "options" feed from CRM.
  if (tags.length < 2) tags.push("Гардеробная");
  const VISIBLE_TAGS = 2;
  const hiddenTagCount = Math.max(0, tags.length - VISIBLE_TAGS);

  return (
    <section id="layouts" className={`${PAGE_PAD} py-16`}>
      <Reveal mode="up">
        <div className="grid grid-cols-[1fr_400px] overflow-hidden shadow-card">
          {/* Left — white area: filter row + plan carousel + pagination */}
          <div className="flex min-h-[560px] flex-col bg-base-0 px-10 py-8">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {ROOM_TYPES.map((rt) => {
                  const count = roomCounts[rt.key] ?? 0;
                  const disabled = count === 0;
                  const active = rt.key === room && !disabled;
                  return (
                    <Pressable
                      key={rt.key}
                      disabled={disabled}
                      onClick={() => !disabled && pickRoom(rt.key)}
                      rippleColor={
                        active ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.08)"
                      }
                      className={`h-10 px-5 font-sans text-small font-medium transition-colors ${
                        disabled
                          ? "cursor-not-allowed border border-base-200 bg-base-0 text-base-200"
                          : active
                            ? "bg-night-500 text-base-0"
                            : "border border-base-200 bg-base-0 text-base-800"
                      }`}
                      title={disabled ? "Нет квартир этого типа" : undefined}
                    >
                      {rt.label}
                    </Pressable>
                  );
                })}
              </div>

              <button
                type="button"
                className="grid h-10 w-10 place-items-center border border-base-200 text-base-800 transition-colors hover:bg-base-100"
                aria-label="Развернуть"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                  <path d="M2 5V2h3M12 5V2H9M2 9v3h3M12 9v3H9" />
                </svg>
              </button>
            </div>

            {/* Plan + carousel arrows */}
            <div className="relative mt-6 flex flex-1 items-center justify-center">
              <button
                type="button"
                onClick={prev}
                disabled={total < 2}
                className="absolute left-0 grid h-12 w-12 place-items-center text-base-600 transition-colors hover:text-base-800 disabled:opacity-30"
                aria-label="Предыдущая планировка"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 1L3 7l6 6" />
                </svg>
              </button>

              <div className="relative h-full w-full max-w-[420px]">
                {sample ? (
                  <PlanImage
                    src={apartmentPlanUrl(sample)}
                    alt={`Планировка квартиры №${sample.number}`}
                    className="absolute inset-0 h-full w-full object-contain"
                    fallback={
                      <div className="grid h-full w-full place-items-center font-sans text-small text-base-300">
                        Планировка №{sample.number}
                      </div>
                    }
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center font-sans text-small text-base-300">
                    Нет планировок
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={next}
                disabled={total < 2}
                className="absolute right-0 grid h-12 w-12 place-items-center text-base-600 transition-colors hover:text-base-800 disabled:opacity-30"
                aria-label="Следующая планировка"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 1l6 6-6 6" />
                </svg>
              </button>
            </div>

            <p className="mt-4 text-center font-sans text-small text-base-800">
              {total > 0 ? `${index + 1} из ${total}` : "—"}
            </p>
          </div>

          {/* Right — dark info panel */}
          <div className="relative flex min-h-[560px] flex-col bg-night-500 text-base-0">
            <div className="flex flex-col gap-8 p-8 pb-32">
              {/* Tag chips */}
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, VISIBLE_TAGS).map((t, idx) => (
                  <span
                    key={t}
                    className={`px-3 py-1.5 font-sans text-small font-medium ${
                      idx === 0 ? "bg-base-0 text-base-800" : "bg-base-0/15 text-base-0"
                    }`}
                  >
                    {t}
                  </span>
                ))}
                {hiddenTagCount > 0 && (
                  <span className="bg-base-0/15 px-3 py-1.5 font-sans text-small font-medium text-base-0">
                    Ещё +{hiddenTagCount}
                  </span>
                )}
              </div>

              {/* Title block */}
              <div className="mt-8">
                <p className="font-sans text-small text-base-0/40">
                  {total} {pluralize(total, ["планировка", "планировки", "планировок"])}
                </p>
                <h3 className="mt-2 font-sans text-[28px] font-semibold uppercase leading-none tracking-[0.02em]">
                  {headingMap[room]}
                </h3>

                {/* Inline meta — Корпус | Секция | Этаж | срок */}
                <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 font-sans text-small text-base-0/70">
                  <span>Корпус {house.number}</span>
                  <span className="h-3 w-px bg-base-0/30" />
                  <span>Секция {sample?.sectionNumber ?? "—"}</span>
                  <span className="h-3 w-px bg-base-0/30" />
                  <span>
                    Этаж {sample?.floor ?? "—"}/{topFloor || "—"}
                  </span>
                  <span className="h-3 w-px bg-base-0/30" />
                  <span>{house.endDate}</span>
                </div>
              </div>

              {/* Specs grid */}
              <div className="mt-auto grid grid-cols-2 gap-x-6 gap-y-6">
                <div>
                  <p className="font-sans text-small text-base-0/50">Площадь</p>
                  <p className="mt-1 font-sans text-body font-medium">
                    {formatArea(minArea)}–{formatArea(maxArea)}
                  </p>
                </div>
                <div>
                  <p className="font-sans text-small text-base-0/50">Стоимость</p>
                  <p className="mt-1 font-sans text-body font-medium">
                    {formatPriceRange(minPrice, maxPrice)}
                  </p>
                </div>
                <div>
                  <p className="font-sans text-small text-base-0/50">Высота потолков</p>
                  <p className="mt-1 font-sans text-body font-medium">3,0–3,1 м</p>
                </div>
              </div>
            </div>

            {/* Bottom accent CTA */}
            <Pressable
              onClick={() => nav(`/catalog?rooms=${encodeURIComponent(room)}`)}
              rippleColor="rgba(255,255,255,0.2)"
              className="absolute bottom-0 left-0 right-0 flex h-14 items-center justify-center bg-accent px-6 font-sans text-body font-medium text-base-0"
            >
              {total}{" "}
              {pluralize(total, [
                "квартира с такой планировкой",
                "квартиры с такой планировкой",
                "квартир с такой планировкой",
              ])}
            </Pressable>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function formatPriceRange(min: number, max: number): string {
  // Both in millions — collapse currency suffix to a single tail.
  const toMln = (v: number) => (v / 1_000_000).toFixed(1).replace(".", ",");
  if (min >= 1_000_000 && max >= 1_000_000) {
    return `${toMln(min)}–${toMln(max)} млн ₽`;
  }
  return `${formatPrice(min)} – ${formatPrice(max)}`;
}

function pluralize(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Инженерные системы — dark section, фото справа
// ─────────────────────────────────────────────────────────────────────────────

function Engineering() {
  const c = useContent("about.engineering", ABOUT_ENGINEERING_DEFAULTS);
  const headingLines = c.heading.split("\n");
  const handleCta = () => {
    if (!c.ctaUrl) return;
    if (c.ctaUrl.startsWith("tel:") || c.ctaUrl.startsWith("mailto:")) {
      window.location.href = c.ctaUrl;
    } else if (c.ctaUrl.startsWith("/")) {
      window.location.href = c.ctaUrl;
    } else {
      window.open(c.ctaUrl, "_blank", "noopener,noreferrer");
    }
  };
  return (
    <section id="engineering" className="relative w-full bg-night-500 text-base-0">
      <div className={`grid grid-cols-[1.4fr_1fr] gap-16 ${PAGE_PAD} py-24`}>
        <div className="flex min-h-[680px] flex-col">
          <Reveal mode="up">
            <h2 className="font-display text-[64px] font-semibold uppercase leading-[1.1] tracking-[-0.02em] text-base-0">
              {headingLines.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < headingLines.length - 1 && <br />}
                </span>
              ))}
            </h2>
          </Reveal>

          <Reveal mode="up" delay={200}>
            <div className="mt-auto max-w-[620px] space-y-5 pt-16 font-sans text-small leading-relaxed text-base-0/85">
              {c.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="flex flex-col">
          <Reveal mode="up" delay={120}>
            <p className="flex items-center gap-3 font-display text-upper font-extrabold uppercase tracking-[-0.02em] text-base-0">
              <span className="inline-block h-2.5 w-2.5 bg-base-0" />
              {c.eyebrow}
            </p>
          </Reveal>

          <Reveal mode="up" delay={200}>
            <div className="relative mt-12 aspect-[3/4] w-full overflow-hidden bg-base-0/[0.04]">
              {c.photo && (
                <img
                  src={c.photo}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
            </div>
          </Reveal>

          <Reveal mode="up" delay={300}>
            <Pressable
              onClick={handleCta}
              rippleColor="rgba(255,255,255,0.18)"
              className="flex h-14 w-full items-center justify-between bg-base-0/[0.07] px-6 font-sans text-body font-medium text-base-0 transition-colors hover:bg-base-0/[0.12]"
            >
              {c.ctaLabel}
              <IconArrowRight size={18} />
            </Pressable>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Динамика строительства
// ─────────────────────────────────────────────────────────────────────────────

function Construction() {
  const nav = useNavigate();
  const c = useContent("about.construction", ABOUT_CONSTRUCTION_DEFAULTS);
  const handleGallery = () => {
    if (c.galleryUrl) {
      if (c.galleryUrl.startsWith("/")) nav(c.galleryUrl);
      else window.open(c.galleryUrl, "_blank", "noopener,noreferrer");
    } else {
      nav("/about/construction-gallery");
    }
  };
  return (
    <section id="construction" className="relative w-full bg-base-0">
      <div className="grid grid-cols-[1fr_2fr_1.6fr]">
        <div className="flex items-center pl-20">
          <Reveal mode="up">
            <p className="font-sans text-body text-base-600">Общий статус</p>
          </Reveal>
        </div>

        <div className="flex flex-col py-24 pr-12">
          <Reveal mode="up">
            <h2 className="font-display text-[36px] font-bold uppercase leading-[1.1] tracking-[-0.02em] text-base-800">
              Динамика
              <br />
              строительства
            </h2>
          </Reveal>

          <Reveal mode="up" delay={150}>
            <div className="mt-8 flex gap-4">
              <SelectChip label={c.building} />
              <SelectChip label={c.period} />
            </div>
          </Reveal>

          <Reveal mode="up" delay={220}>
            <div className="mt-10 max-w-[480px] border-t border-base-200" />
          </Reveal>

          <Reveal mode="up" delay={260}>
            <p className="mt-8 max-w-[480px] font-sans text-body leading-relaxed text-base-800">
              {c.intro}
            </p>

            <ul className="mt-6 max-w-[480px] space-y-3 font-sans text-body leading-relaxed text-base-700">
              {c.bullets.map((b, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-[9px] inline-block h-[5px] w-[5px] flex-shrink-0 rounded-full bg-base-800" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal mode="up" delay={360}>
            <Pressable
              onClick={handleGallery}
              rippleColor="rgba(255,255,255,0.2)"
              className="mt-12 flex h-14 w-full items-center justify-between bg-accent px-6 font-sans text-body font-medium text-base-0"
            >
              {c.galleryLabel}
              <IconArrowRight size={18} />
            </Pressable>
          </Reveal>
        </div>

        <Reveal mode="right" delay={120}>
          <div className="relative h-full min-h-[680px] w-full overflow-hidden bg-base-100">
            {c.photo && (
              <img
                src={c.photo}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function SelectChip({ label }: { label: string }) {
  // Visual-only placeholder. Real selects (корпус/месяц) will hook up later.
  return (
    <button
      type="button"
      className="flex h-12 items-center gap-3 rounded-md bg-base-100 px-4 font-sans text-body font-medium text-base-800 transition-colors hover:bg-base-200"
    >
      {label}
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 1l4 4 4-4" />
      </svg>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Офис продаж — карточка с фоновым фото
// ─────────────────────────────────────────────────────────────────────────────

function Office() {
  const c = useContent("about.office", ABOUT_OFFICE_DEFAULTS);
  const titleLines = c.title.split("\n");
  const handleRoute = () => {
    if (!c.routeUrl) return;
    window.open(c.routeUrl, "_blank", "noopener,noreferrer");
  };
  // Live Yandex map widget — no API key needed for this iframe endpoint.
  // Falls back to the static mapImage if coords are missing.
  const hasCoords = Number.isFinite(c.mapLat) && Number.isFinite(c.mapLng);
  const yandexSrc = hasCoords
    ? `https://yandex.ru/map-widget/v1/?ll=${c.mapLng},${c.mapLat}&z=${c.mapZoom || 16}&l=map`
    : null;
  return (
    <section id="office" className="relative w-full bg-base-100">
      <div
        className="relative w-full overflow-hidden bg-night-500"
        style={{ aspectRatio: "1692 / 991" }}
      >
        {yandexSrc ? (
          <iframe
            src={yandexSrc}
            title="Карта района офиса продаж"
            loading="lazy"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
            // pointer-events: none keeps the map static — it's a backdrop, not
            // an interactive widget. Filter darkens + desaturates so the map
            // blends with the Imperial Night palette.
            style={{
              pointerEvents: "none",
              filter: "grayscale(100%) brightness(0.4) contrast(1.35)",
            }}
          />
        ) : (
          c.mapImage && (
            <img
              src={c.mapImage}
              alt="Карта района офиса продаж"
              className="absolute inset-0 h-full w-full object-contain opacity-95"
            />
          )
        )}

        {/* Marker — anchored so the tip of the triangle lands on the exact
            map centre (= the configured coordinates). */}
        <div className="absolute left-1/2 top-1/2 z-[1] flex -translate-x-1/2 -translate-y-full flex-col items-center">
          <div className="grid h-16 w-16 place-items-center bg-base-800 text-base-0 shadow-card">
            <span className="font-display text-[16px] font-bold leading-none tracking-[0.05em]">
              CG
            </span>
          </div>
          {/* Downward triangle pointer */}
          <div
            className="h-0 w-0"
            style={{
              borderLeft: "9px solid transparent",
              borderRight: "9px solid transparent",
              borderTop: "11px solid #17181C",
              filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.25))",
            }}
          />
        </div>

        <Reveal mode="up" delay={120} className="absolute bottom-0 right-0 w-[440px]">
          <div className="flex flex-col bg-night-500 text-base-0 shadow-card">
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-base-100">
              {c.photo && (
                <img
                  src={c.photo}
                  alt="Фото офиса продаж"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
            </div>

            <div className="flex flex-col px-8 pb-8 pt-7">
              <h3 className="font-display text-[20px] font-bold uppercase leading-[1.1] tracking-[-0.02em]">
                {titleLines.map((l, i) => (
                  <span key={i}>
                    {l}
                    {i < titleLines.length - 1 && <br />}
                  </span>
                ))}
              </h3>
              <p className="mt-7 font-sans text-small text-base-0/65">{c.address}</p>
              <p className="font-sans text-small text-base-0/65">{c.phone}</p>
            </div>

            <Pressable
              onClick={handleRoute}
              rippleColor="rgba(255,255,255,0.18)"
              className="flex h-14 w-full items-center justify-between bg-base-0/[0.07] px-8 font-sans text-body font-medium text-base-0 transition-colors hover:bg-base-0/[0.12]"
            >
              {c.ctaLabel}
              <IconArrowRight size={18} />
            </Pressable>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Документация — короткая секция в две колонки
// ─────────────────────────────────────────────────────────────────────────────

function Documents() {
  const c = useContent("about.documents", ABOUT_DOCUMENTS_DEFAULTS);
  return (
    <section id="documents" className={`${PAGE_PAD} py-24`}>
      <div className="grid grid-cols-[280px_1fr_280px] items-start gap-12">
        <Reveal mode="up">
          <p className="flex items-center gap-3 font-display text-upper font-extrabold uppercase tracking-[-0.02em] text-base-800">
            <span className="inline-block h-2.5 w-2.5 bg-base-800" />
            {c.eyebrow}
          </p>
        </Reveal>

        <Reveal mode="up" delay={120}>
          <div className="mx-auto max-w-[640px]">
            <div className="font-sans text-body leading-relaxed text-base-800">
              <div className="float-left mr-5 mt-1 grid h-[90px] w-[90px] place-items-center overflow-hidden bg-base-100">
                {c.logo ? (
                  <img src={c.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <svg
                    viewBox="0 0 56 56"
                    className="h-12 w-12 text-base-800"
                    fill="currentColor"
                    aria-hidden
                  >
                    <rect x="6" y="14" width="44" height="2" />
                    <rect x="9" y="18" width="3" height="18" />
                    <rect x="16" y="18" width="3" height="18" />
                    <rect x="23" y="18" width="3" height="18" />
                    <rect x="30" y="18" width="3" height="18" />
                    <rect x="37" y="18" width="3" height="18" />
                    <rect x="44" y="18" width="3" height="18" />
                    <rect x="6" y="38" width="44" height="2" />
                    <text
                      x="28"
                      y="50"
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight="700"
                      fontFamily="inherit"
                    >
                      ДОМ.РФ
                    </text>
                  </svg>
                )}
              </div>
              <p>{c.body}</p>
            </div>

            <div className="mt-12 flex justify-center">
              <a
                href={c.docsUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-14 items-center gap-5 bg-night-500 px-7 font-sans text-body font-medium text-base-0 transition-colors hover:bg-night-400"
              >
                {c.ctaLabel}
                <span className="h-px w-5 bg-base-0/40" />
                <IconArrowRight size={18} />
              </a>
            </div>
          </div>
        </Reveal>

        <div />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────────────────────

function PageFooter() {
  return (
    <footer className={`border-t border-base-200 bg-night-500 ${PAGE_PAD} py-12 text-base-0/55`}>
      <div className="flex items-center justify-between font-sans text-small">
        <div className="flex items-center gap-6">
          <span>© Capital Group · {new Date().getFullYear()}</span>
          <span className="h-1 w-1 rounded-full bg-base-0/30" />
          <a
            href="https://cg-projects.ru"
            onClick={(e) => e.preventDefault()}
            className="hover:text-base-0"
          >
            cg-projects.ru
          </a>
        </div>
        <span>ЖК МАСТЕРС · Capital Group</span>
      </div>
    </footer>
  );
}
