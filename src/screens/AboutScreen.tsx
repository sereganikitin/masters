import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Reveal } from "@/components/Reveal";
import { Pressable } from "@/components/Pressable";
import { PlanImage } from "@/components/PlanImage";
import { GenplanCanvas } from "@/components/GenplanCanvas";
import { getHouse, formatArea, formatPrice, ROOM_TYPES } from "@/data/complex";
import { apartmentPlanUrl } from "@/lib/plans";
import type { Apartment, RoomType } from "@/data/types";
import {
  IconClose,
  IconArrowRight,
  IconPhone,
  IconPlay,
} from "@/components/Icon";

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
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout primitives
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_PAD = "px-20"; // 80px gutter on 1920 stage

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans text-upper uppercase tracking-[0.3em] text-base-600">{children}</p>
  );
}

function SectionLabelDark({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans text-upper uppercase tracking-[0.3em] text-base-0/55">{children}</p>
  );
}

function Heading({
  children,
  className = "",
  dark = false,
}: {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}) {
  // 56px UPPERCASE — Onest semibold mimics RF Dewi Expanded better than Unbounded.
  return (
    <Reveal mode="up">
      <h2
        className={`font-sans text-[56px] font-semibold uppercase leading-[0.95] tracking-[-0.01em] ${dark ? "text-base-0" : "text-base-800"} ${className}`}
      >
        {children}
      </h2>
    </Reveal>
  );
}

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

function SecondaryButton({
  children,
  onClick,
  dark = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  dark?: boolean;
}) {
  return (
    <Pressable
      onClick={onClick}
      rippleColor={dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)"}
      className={`flex h-14 w-fit items-center gap-3 border px-7 font-sans text-body font-medium ${dark ? "border-base-0/40 bg-transparent text-base-0" : "border-base-800 bg-base-0 text-base-800"}`}
    >
      {children}
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Header
// ─────────────────────────────────────────────────────────────────────────────

function PageHeader() {
  const nav = useNavigate();
  return (
    <header
      className={`flex items-center justify-between border-b border-base-200 bg-base-0 ${PAGE_PAD} py-6`}
    >
      <button onClick={() => nav("/")} className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center bg-base-800 text-base-0">
          <span className="font-display text-[14px] font-bold leading-none">CG</span>
        </div>
        <span className="font-display text-[14px] font-medium uppercase tracking-[0.25em] text-base-800">
          Capital Group
        </span>
      </button>

      <nav className="flex items-center gap-12 font-sans text-body font-medium text-base-800">
        <button onClick={() => nav("/catalog")} className="transition-opacity hover:opacity-60">
          Выбрать квартиру
        </button>
        <button className="transition-opacity hover:opacity-60">О компании</button>
        <button className="transition-opacity hover:opacity-60">Контакты</button>
      </nav>

      <div className="flex items-center gap-8 font-sans text-body font-medium text-base-800">
        <span className="tracking-wide">+7 (495) 021-11-11</span>
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
  return (
    <section className={`${PAGE_PAD} py-24`}>
      <div className="grid grid-cols-2 gap-16">
        <div>
          <Reveal mode="up">
            <h1 className="font-sans text-[64px] font-semibold uppercase leading-[0.95] tracking-[-0.01em] text-base-800">
              Премиальный
              <br />
              дом МАСТЕРС
            </h1>
          </Reveal>

          <Reveal mode="up" delay={120}>
            <dl className="mt-16 divide-y divide-base-200 border-t border-base-200">
              <MetaRow label="Класс жилья">Премиум</MetaRow>
              <MetaRow label="Срок сдачи">IV кв. 2029 г.</MetaRow>
              <MetaRow label="Адрес">г. Москва, ул. Викторенко, 16</MetaRow>
              <MetaRow label="О проекте">
                МАСТЕРС у метро Аэропорт — ансамбль разновысотных секций от 8 до 25 этажей.
                Приватный двор и линейный парк с амфитеатром. Клубная гостиная с камином
                и коворкинг только для резидентов.
              </MetaRow>
            </dl>
          </Reveal>
        </div>

        <div className="flex flex-col gap-6">
          <Reveal mode="up" delay={200}>
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-base-100">
              <img
                src="/images/hero-genplan.png"
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </Reveal>

          <Reveal mode="up" delay={300}>
            <div className="grid grid-cols-2 gap-4">
              <CtaTile icon={<IconPlay size={20} />} title="Видео о проекте" sub="Узнайте больше" />
              <CtaTile
                icon={<IconArrowRight size={20} />}
                title="Сайт проекта"
                sub="Перейти на сайт"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[200px_1fr] gap-8 py-5">
      <dt className="font-sans text-small text-base-600">{label}</dt>
      <dd className="font-sans text-body font-medium leading-relaxed text-base-800">{children}</dd>
    </div>
  );
}

function CtaTile({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <Pressable
      rippleColor="rgba(0,0,0,0.08)"
      className="flex items-center gap-4 bg-base-100 px-5 py-4 text-left"
    >
      <div className="grid h-10 w-10 flex-shrink-0 place-items-center bg-base-0 text-base-800">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-display text-[14px] font-semibold uppercase tracking-[0.1em] text-base-800">
          {title}
        </p>
        <p className="font-sans text-small text-base-600">{sub}</p>
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
    <section className="relative w-full bg-night-500 text-base-0">
      <div className={`${PAGE_PAD} pb-16 pt-24`}>
        <Heading dark>Генплан проекта</Heading>
      </div>

      {/* Same aerial + section chips as the interactive /genplan, but here
        * sections are NOT clickable and admin overlays are NOT shown.
        * Surrounding POI labels (Викторенко, Авиапарк, школа, парк…) are added. */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: "1920 / 1080" }}
      >
        <GenplanCanvas showOverlays={false} showPOI chipsOffsetY={50} />

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
  return (
    <section className={`${PAGE_PAD} py-24`}>
      <div className="grid grid-cols-[1fr_1.4fr] items-start gap-16">
        <div>
          <Reveal mode="up">
            <SectionLabel>Виртуальный тур</SectionLabel>
          </Reveal>
          <Heading className="mt-6">3D-тур</Heading>
          <Reveal mode="up" delay={200}>
            <div className="mt-10">
              <PrimaryButton onClick={() => nav("/tour")}>Смотреть 3D тур</PrimaryButton>
            </div>
          </Reveal>
        </div>

        <Reveal mode="right" delay={120}>
          <div className="space-y-8">
            <div className="grid grid-cols-[120px_1fr] gap-6">
              <div className="relative aspect-square w-full overflow-hidden bg-base-100">
                <img
                  src="/images/about/tour-thumb.png"
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <p className="font-sans text-h5 leading-relaxed text-base-700">
                Взгляните на район дома «Мастерс» с нового ракурса в нашем интерактивном
                3D-туре. Переключайтесь между дневным и вечерним временем, чтобы оценить
                панорамные виды Петровского парка, стадиона «ВЭБ Арена» и делового центра
                Москва-Сити.
              </p>
            </div>
            <p className="font-sans text-body leading-relaxed text-base-600">
              Это уникальный шанс изучить среду, масштаб и перспективы будущего дома,
              прежде чем сделать решающий выбор.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Особые форматы — 3 карточки с фото
// ─────────────────────────────────────────────────────────────────────────────

function SpecialFormats() {
  const items = [
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
  return (
    <section className={`${PAGE_PAD} py-24`}>
      <div className="mb-16">
        <Reveal mode="up">
          <SectionLabel>Архитектура и форматы</SectionLabel>
        </Reveal>
        <Heading className="mt-6">Особые форматы</Heading>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {items.map((it, i) => (
          <Reveal key={it.tag} mode="up" delay={i * 100}>
            <article className="flex h-full flex-col">
              <div className="relative aspect-square w-full overflow-hidden bg-base-100">
                <img
                  src={it.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 hover:scale-[1.04]"
                />
                <span className="absolute left-5 top-5 bg-base-0/95 px-3 py-1.5 font-display text-[12px] font-semibold uppercase tracking-[0.1em] text-base-800">
                  {it.tag}
                </span>
              </div>
              <div className="mt-6 flex flex-1 flex-col">
                <h3 className="font-display text-[24px] font-semibold uppercase leading-tight tracking-[0.02em] text-base-800">
                  {it.title}
                </h3>
                <p className="mt-4 flex-1 font-sans text-body leading-relaxed text-base-600">
                  {it.body}
                </p>
                <button className="mt-6 flex items-center gap-2 self-start font-sans text-body font-medium text-base-800 transition-opacity hover:opacity-60">
                  Подробнее
                  <IconArrowRight size={16} />
                </button>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal mode="up" delay={400}>
        <div className="mt-12 flex justify-center">
          <SecondaryButton>Показать ещё 3</SecondaryButton>
        </div>
      </Reveal>
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

  // Initial selection — first available type, falls back to first listed.
  const firstAvailable = ROOM_TYPES.find((rt) => (roomCounts[rt.key] ?? 0) > 0);
  const [room, setRoom] = useState<RoomType>(firstAvailable?.key ?? "1");

  // Sample apartment of selected room type — used to render plan + ranges.
  const matching = useMemo(
    () => allApartments.filter((a) => a.roomType === room),
    [allApartments, room],
  );
  const sample = matching[0];

  const range = (vals: number[]) => {
    if (vals.length === 0) return [0, 0] as [number, number];
    return [Math.min(...vals), Math.max(...vals)] as [number, number];
  };
  const [minArea, maxArea] = range(matching.map((a) => a.area));
  const [minPrice, maxPrice] = range(matching.map((a) => a.price));
  const headingMap: Record<RoomType, string> = {
    studio: "студий",
    "1": "1-комн. квартир",
    "2": "2-комн. квартир",
    "3": "3-комн. квартир",
    "4+": "4-комн. квартир и более",
  };

  return (
    <section className={`${PAGE_PAD} py-24`}>
      <div className="grid grid-cols-[1fr_1.2fr] gap-16">
        <div>
          <Reveal mode="up">
            <SectionLabel>Планировки</SectionLabel>
          </Reveal>
          <Heading className="mt-6">
            Удобные
            <br />
            планировки
          </Heading>

          <Reveal mode="up" delay={200}>
            <div className="mt-10 flex flex-wrap gap-2">
              {ROOM_TYPES.map((rt) => {
                const count = roomCounts[rt.key] ?? 0;
                const disabled = count === 0;
                const active = rt.key === room && !disabled;
                return (
                  <Pressable
                    key={rt.key}
                    disabled={disabled}
                    onClick={() => !disabled && setRoom(rt.key)}
                    rippleColor={
                      active ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.08)"
                    }
                    className={`h-12 px-5 font-sans text-body font-medium transition-colors ${
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
          </Reveal>

          <Reveal mode="up" delay={300}>
            <div className="mt-10">
              <PrimaryButton onClick={() => nav("/catalog")}>
                Посмотреть все {allApartments.length} квартир
              </PrimaryButton>
            </div>
          </Reveal>
        </div>

        <Reveal mode="right" delay={120}>
          <div className="grid grid-cols-[1.1fr_1fr] bg-night-500 text-base-0">
            {/* Plan preview — fills the card height, contained so the whole plan is visible. */}
            <div className="relative aspect-[3/4] w-full bg-base-0/[0.04]">
              {sample ? (
                <PlanImage
                  src={apartmentPlanUrl(sample)}
                  alt={`Планировка квартиры №${sample.number}`}
                  className="absolute inset-0 h-full w-full object-contain p-6"
                  fallback={
                    <div className="grid h-full w-full place-items-center font-sans text-small text-base-0/55">
                      Планировка №{sample.number}
                    </div>
                  }
                />
              ) : (
                <div className="grid h-full w-full place-items-center font-sans text-small text-base-0/55">
                  Нет планировок
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col p-8">
              <div className="flex flex-wrap items-start gap-2">
                {sample?.features.largeKitchenLivingRoom && (
                  <span className="bg-base-0/15 px-2.5 py-1 font-sans text-[12px] font-medium text-base-0">
                    Кухня-гостиная
                  </span>
                )}
                {sample?.features.masterBedroom && (
                  <span className="bg-base-0/15 px-2.5 py-1 font-sans text-[12px] font-medium text-base-0">
                    Мастер-спальня
                  </span>
                )}
                {sample?.decoration && (
                  <span className="bg-base-0/15 px-2.5 py-1 font-sans text-[12px] font-medium text-base-0">
                    {sample.decoration}
                  </span>
                )}
              </div>

              <div className="mt-8">
                <p className="font-sans text-small text-base-0/40">
                  {matching.length} {pluralize(matching.length, ["планировка", "планировки", "планировок"])}
                </p>
                <h3 className="mt-2 font-sans text-[28px] font-semibold uppercase leading-none tracking-[0.02em]">
                  {headingMap[room]}
                </h3>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-base-0/15 pt-6 font-sans text-small">
                <span className="text-base-0/55">Корпус</span>
                <span className="text-right">{house.number}</span>
                <span className="text-base-0/55">Этажность</span>
                <span className="text-right">{house.storeysRange}</span>
                <span className="text-base-0/55">Сдача</span>
                <span className="text-right">{house.endDate}</span>
              </div>

              <div className="mt-6 space-y-2 font-sans text-small">
                <div className="flex justify-between">
                  <span className="text-base-0/55">Площадь</span>
                  <span>
                    {formatArea(minArea)} — {formatArea(maxArea)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-0/55">Стоимость</span>
                  <span>
                    от {formatPrice(minPrice)} до {formatPrice(maxPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-0/55">Высота потолков</span>
                  <span>3,0–3,1 м</span>
                </div>
              </div>

              <Pressable
                onClick={() => nav("/catalog")}
                rippleColor="rgba(255,255,255,0.18)"
                className="mt-auto flex h-14 w-full items-center justify-between bg-accent px-6 font-sans text-body font-medium text-base-0"
              >
                {matching.length}{" "}
                {pluralize(matching.length, [
                  "квартира с такой планировкой",
                  "квартиры с такой планировкой",
                  "квартир с такой планировкой",
                ])}
                <IconArrowRight size={18} />
              </Pressable>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
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
  return (
    <section className="relative w-full bg-night-500 text-base-0">
      <div className="grid grid-cols-[1.1fr_1fr] gap-16">
        <div className={`${PAGE_PAD} py-24`}>
          <Reveal mode="up">
            <SectionLabelDark>Мастерство в деталях</SectionLabelDark>
          </Reveal>
          <Heading dark className="mt-6">
            Инженерные
            <br />
            системы
          </Heading>

          <Reveal mode="up" delay={200}>
            <p className="mt-12 font-sans text-body leading-relaxed text-base-0/85">
              В квартирах предусмотрены естественная вентиляция через открывающиеся
              створки и приточные клапаны, а также центральная система кондиционирования
              — остаётся установить только внутренний блок. Вода проходит многоступенчатую
              очистку (механическая фильтрация, умягчение и тонкая очистка).
            </p>
            <p className="mt-6 font-sans text-body leading-relaxed text-base-0/85">
              Предусмотрены повышенные электрические мощности, а для квартир с террасами —
              дополнительные. В лобби и общественных зонах поддерживается комфортный
              микроклимат, горячая вода подаётся сразу благодаря рециркуляции. Для удобства
              жителей доступен Wi-Fi в лобби и на придомовой территории, а связь усилена в
              паркинге и лифтах.
            </p>
          </Reveal>

          <Reveal mode="up" delay={320}>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <PrimaryButton>Консультация</PrimaryButton>
              <SecondaryButton dark>Заказать звонок</SecondaryButton>
            </div>
          </Reveal>
        </div>

        <Reveal mode="right" delay={120}>
          <div className="relative h-full min-h-[640px] w-full overflow-hidden bg-base-100">
            <img
              src="/images/about/engineering.png"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Динамика строительства
// ─────────────────────────────────────────────────────────────────────────────

function Construction() {
  const bullets = [
    "Монолитные работы: заливка колонн и плит перекрытий с 8-го по 12-й этажи.",
    "Фасадные работы: подготовка к монтажу алюминиевых панелей и элементов остекления.",
    "Начало работ по формированию ландшафта.",
  ];
  return (
    <section className={`${PAGE_PAD} py-24`}>
      <Reveal mode="up">
        <SectionLabel>Общий статус</SectionLabel>
      </Reveal>
      <Heading className="mt-6">
        Динамика
        <br />
        строительства
      </Heading>

      <div className="mt-16 grid grid-cols-[1fr_1fr] gap-16">
        <Reveal mode="left" delay={120}>
          <div>
            <p className="font-sans text-h5 leading-relaxed text-base-800">
              В августе работы были сконцентрированы на возведении вертикальных
              конструкций и подготовке к монтажу уникальных фасадных решений.
            </p>

            <ul className="mt-8 space-y-3 font-sans text-body leading-relaxed text-base-700">
              {bullets.map((b) => (
                <li key={b} className="flex gap-3">
                  <span className="mt-2.5 h-1 w-3 flex-shrink-0 bg-base-800" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <span className="flex h-12 items-center bg-base-100 px-5 font-sans text-body font-medium text-base-800">
                Корпус 1
              </span>
              <span className="flex h-12 items-center bg-base-100 px-5 font-sans text-body font-medium text-base-800">
                Август 2025
              </span>
            </div>

            <div className="mt-8">
              <PrimaryButton>Смотреть галерею</PrimaryButton>
            </div>
          </div>
        </Reveal>

        <Reveal mode="right" delay={200}>
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-base-100">
            <img
              src="/images/about/construction.png"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Офис продаж — карточка с фоновым фото
// ─────────────────────────────────────────────────────────────────────────────

function Office() {
  // Full-width dark map of the district with a CG marker in the centre and
  // a self-contained office tile pinned to the bottom-right corner — matches
  // cg-projects.ru/about layout.
  return (
    <section className="relative w-full bg-base-100">
      {/* Match the original image aspect ratio (1692×991) so the map is shown
        * in full — no top/bottom crop. */}
      <div
        className="relative w-full overflow-hidden bg-night-500"
        style={{ aspectRatio: "1692 / 991" }}
      >
        <img
          src="/images/about/office-map.png"
          alt="Карта района офиса продаж"
          className="absolute inset-0 h-full w-full object-contain opacity-95"
        />

        {/* CG marker — centred over the map */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="grid h-12 w-12 place-items-center bg-base-800 text-base-0 shadow-card">
            <span className="font-display text-[13px] font-bold leading-none tracking-[0.05em]">
              CG
            </span>
          </div>
        </div>

        {/* Office tile — bottom right */}
        <Reveal mode="up" delay={120} className="absolute bottom-10 right-10 w-[420px]">
          <div className="flex flex-col bg-night-500 text-base-0 shadow-card">
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-base-100">
              <img
                src="/images/about/office.png"
                alt="Фото офиса продаж"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col gap-2 p-8">
              <h3 className="font-sans text-[24px] font-semibold uppercase leading-tight tracking-[0.02em]">
                Офис продаж
                <br />
                «Мастерс»
              </h3>
              <p className="mt-4 font-sans text-body text-base-0/75">
                г. Москва, Проезд Аэропорта, 8
              </p>
              <p className="font-sans text-body text-base-0/75">+7 (495) 021-11-11</p>
              <Pressable
                rippleColor="rgba(255,255,255,0.18)"
                className="mt-6 flex h-12 w-full items-center justify-between bg-base-0/[0.07] px-5 font-sans text-small font-medium text-base-0"
              >
                Проложить маршрут
                <IconArrowRight size={16} />
              </Pressable>
            </div>
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
  return (
    <section className={`${PAGE_PAD} py-24`}>
      <div className="border-t border-base-200 pt-16">
        <Reveal mode="up">
          <SectionLabel>Документы</SectionLabel>
        </Reveal>
        <Heading className="mt-6">Документация</Heading>

        <div className="mt-12 grid grid-cols-[1.4fr_auto] items-end gap-16">
          <Reveal mode="up" delay={120}>
            <p className="max-w-[960px] font-sans text-h5 leading-relaxed text-base-800">
              Вся проектная документация доступна на официальном портале ДОМ.РФ.
              Здесь вы найдёте актуальные планы, разрешения, проектные декларации и
              другие официальные материалы для детального изучения проекта.
              Сведения обновляются по мере прохождения этапов строительства и
              согласований.
            </p>
          </Reveal>
          <Reveal mode="up" delay={200}>
            <PrimaryButton>Изучить документы</PrimaryButton>
          </Reveal>
        </div>
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
