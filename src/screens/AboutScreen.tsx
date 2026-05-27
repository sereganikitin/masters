import { useNavigate } from "react-router-dom";
import { Reveal } from "@/components/Reveal";
import { Pressable } from "@/components/Pressable";
import { useParallax } from "@/lib/useParallax";
import {
  IconClose,
  IconArrowRight,
  IconMap,
  IconCube,
  IconPhone,
  IconPlay,
  IconHome,
} from "@/components/Icon";

// Editorial about page modelled on cg-projects.ru — black-on-white layout,
// huge UPPERCASE section titles, framed photos, metadata as a key/value list.
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
        <SectionDivider />
        <Genplan />
        <SectionDivider />
        <Tour3d />
        <SectionDivider />
        <SpecialFormats />
        <SectionDivider />
        <Engineering />
        <SectionDivider />
        <Construction />
        <SectionDivider />
        <Office />
        <SectionDivider />
        <Documents />
        <PageFooter />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable primitives
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_PAD = "px-20"; // 80px gutter on a 1920 stage
const SECTION_PAD_Y = "py-28";

function SectionTitle({
  kicker,
  children,
}: {
  kicker?: string;
  children: React.ReactNode;
}) {
  return (
    <header className="mb-12">
      {kicker && (
        <Reveal mode="up">
          <p className="mb-6 font-sans text-upper uppercase tracking-[0.3em] text-base-600">
            {kicker}
          </p>
        </Reveal>
      )}
      <Reveal mode="up" delay={80}>
        <h2 className="font-display text-[88px] font-semibold uppercase leading-[0.95] tracking-[-0.02em] text-base-800">
          {children}
        </h2>
      </Reveal>
    </header>
  );
}

function SectionDivider() {
  return (
    <div className={`${PAGE_PAD}`}>
      <div className="h-px w-full bg-base-800" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Header — slim navigation per cg-projects.ru
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
// Hero — 2-column editorial layout
// ─────────────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className={`${PAGE_PAD} ${SECTION_PAD_Y}`}>
      <div className="grid grid-cols-2 gap-16">
        {/* Left column — title + meta table */}
        <div>
          <Reveal mode="up">
            <h1 className="font-display text-[88px] font-semibold uppercase leading-[0.95] tracking-[-0.02em] text-base-800">
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

        {/* Right column — framed photo + CTA cards */}
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
    <div className="grid grid-cols-[180px_1fr] gap-8 py-5">
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
// Section: Генплан проекта
// ─────────────────────────────────────────────────────────────────────────────

function Genplan() {
  const nav = useNavigate();
  const bgRef = useParallax<HTMLDivElement>(0.2);
  return (
    <section className={`${PAGE_PAD} ${SECTION_PAD_Y}`}>
      <SectionTitle>Генплан проекта</SectionTitle>

      <div className="grid grid-cols-[1.6fr_1fr] gap-16">
        <Reveal mode="left" delay={120}>
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-base-100">
            <div ref={bgRef} className="absolute inset-0 -top-[5%] h-[110%]">
              <img
                src="/images/hero-genplan.png"
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </Reveal>

        <div className="flex flex-col justify-between">
          <Reveal mode="right" delay={180}>
            <p className="font-sans text-h5 text-base-700">
              5 секций ансамбля, школа №117 и детский сад в шаговой доступности,
              парк «Берёзовая роща», 15 минут до м. ЦСКА и ТЦ «Авиапарк».
            </p>
          </Reveal>

          <Reveal mode="up" delay={300}>
            <Pressable
              onClick={() => nav("/genplan")}
              rippleColor="rgba(255,255,255,0.25)"
              className="mt-10 flex h-14 w-fit items-center gap-3 bg-base-800 px-7 font-sans text-body font-medium text-base-0"
            >
              <IconMap size={18} />
              Открыть генплан
              <IconArrowRight size={18} />
            </Pressable>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: 3D-тур
// ─────────────────────────────────────────────────────────────────────────────

function Tour3d() {
  const nav = useNavigate();
  return (
    <section className={`${PAGE_PAD} ${SECTION_PAD_Y}`}>
      <SectionTitle>3D-тур</SectionTitle>

      <div className="grid grid-cols-[1fr_1.6fr] gap-16">
        <div className="flex flex-col justify-between">
          <Reveal mode="left" delay={120}>
            <p className="font-sans text-h5 text-base-700">
              Полноэкранный аэровид комплекса с возможностью свободно осмотреть фасады,
              дворы и окружение.
            </p>
          </Reveal>

          <Reveal mode="up" delay={300}>
            <Pressable
              onClick={() => nav("/tour")}
              rippleColor="rgba(255,255,255,0.25)"
              className="mt-10 flex h-14 w-fit items-center gap-3 bg-base-800 px-7 font-sans text-body font-medium text-base-0"
            >
              <IconCube size={18} />
              Запустить 3D-тур
              <IconArrowRight size={18} />
            </Pressable>
          </Reveal>
        </div>

        <Reveal mode="right" delay={180}>
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-base-100">
            <img
              src="/images/tour-scene.png"
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
// Section: Особые форматы
// ─────────────────────────────────────────────────────────────────────────────

function SpecialFormats() {
  const items = [
    { title: "Собственные террасы", note: "Видовые квартиры с террасой до 35 м²" },
    { title: "Ванные с окном", note: "Естественный свет в санузлах" },
    { title: "Квартиры с одиннадцатью окнами", note: "Угловые планировки в башнях" },
    { title: "Мастер-спальни", note: "С приватной ванной и гардеробной" },
    { title: "Кухни-гостиные", note: "От 28 м² с прямой инсоляцией" },
    { title: "Высокие потолки 3,1 м", note: "Во всех квартирах" },
  ];
  return (
    <section className={`${PAGE_PAD} ${SECTION_PAD_Y}`}>
      <SectionTitle kicker="Особые форматы">Планировки,<br />которых нет<br />у соседей</SectionTitle>

      <div className="grid grid-cols-3 gap-px bg-base-200">
        {items.map((it, i) => (
          <Reveal key={it.title} mode="up" delay={(i % 3) * 80} className="bg-base-0">
            <div className="flex h-[320px] flex-col p-10">
              <div className="font-display text-[40px] font-semibold leading-none tracking-tight tabular-nums text-base-600">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="mt-auto">
                <h3 className="font-display text-[20px] font-semibold uppercase leading-tight tracking-[0.02em] text-base-800">
                  {it.title}
                </h3>
                <p className="mt-3 font-sans text-body text-base-600">{it.note}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Каталог
// ─────────────────────────────────────────────────────────────────────────────

// (Реализован как часть Genplan/Tour3d уже не нужно — каталог логично перенести
// в отдельный teaser с переходом /catalog ниже Engineering.)

// ─────────────────────────────────────────────────────────────────────────────
// Section: Инженерные системы
// ─────────────────────────────────────────────────────────────────────────────

function Engineering() {
  return (
    <section className={`${PAGE_PAD} ${SECTION_PAD_Y}`}>
      <SectionTitle kicker="Инженерные системы">Незаметный<br />комфорт</SectionTitle>

      <div className="grid grid-cols-[1.4fr_1fr] gap-16">
        <Reveal mode="left" delay={120}>
          <p className="font-sans text-h5 leading-relaxed text-base-700">
            Приточно-вытяжная вентиляция с подогревом, индивидуальные тепловые узлы,
            бесперебойное водоснабжение с трёхступенчатой очисткой, резервное
            электропитание и Wi-Fi покрытие во всех общественных зонах.
          </p>
        </Reveal>

        <div className="flex flex-col items-start gap-3">
          <Reveal mode="up" delay={200}>
            <Pressable
              rippleColor="rgba(255,255,255,0.25)"
              className="flex h-14 items-center gap-3 bg-base-800 px-7 font-sans text-body font-medium text-base-0"
            >
              Консультация
              <IconArrowRight size={18} />
            </Pressable>
          </Reveal>
          <Reveal mode="up" delay={280}>
            <Pressable
              rippleColor="rgba(0,0,0,0.08)"
              className="flex h-14 items-center gap-3 border border-base-800 bg-base-0 px-7 font-sans text-body font-medium text-base-800"
            >
              Заказать звонок
            </Pressable>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Динамика строительства
// ─────────────────────────────────────────────────────────────────────────────

function Construction() {
  const rows = [
    {
      k: "Монолитные работы",
      v: "Заливка колонн и плит перекрытий с 8-го по 12-й этажи",
    },
    {
      k: "Фасадные работы",
      v: "Подготовка к монтажу алюминиевых панелей и элементов остекления",
    },
    {
      k: "Ландшафт",
      v: "Начало работ по формированию приватного двора и линейного парка",
    },
    { k: "Инфраструктура", v: "Подключение временных коммуникаций" },
  ];
  return (
    <section className={`${PAGE_PAD} ${SECTION_PAD_Y}`}>
      <SectionTitle kicker="Август 2025 · Корпус 1">Динамика<br />строительства</SectionTitle>

      <div className="grid grid-cols-[1.2fr_1fr] gap-16">
        <Reveal mode="left" delay={120}>
          <ul className="divide-y divide-base-200 border-t border-base-200">
            {rows.map((r) => (
              <li key={r.k} className="grid grid-cols-[260px_1fr] gap-8 py-5">
                <span className="font-display text-[16px] font-semibold uppercase tracking-[0.05em] text-base-800">
                  {r.k}
                </span>
                <span className="font-sans text-body text-base-600">{r.v}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <Pressable
              rippleColor="rgba(255,255,255,0.25)"
              className="flex h-14 w-fit items-center gap-3 bg-base-800 px-7 font-sans text-body font-medium text-base-0"
            >
              Смотреть галерею
              <IconArrowRight size={18} />
            </Pressable>
          </div>
        </Reveal>

        <Reveal mode="right" delay={200}>
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-base-100">
            <img
              src="/images/hero-choose.png"
              alt="Фото со стройплощадки"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Офис продаж
// ─────────────────────────────────────────────────────────────────────────────

function Office() {
  return (
    <section className={`${PAGE_PAD} ${SECTION_PAD_Y}`}>
      <SectionTitle kicker="Офис продаж «Мастерс»">Москва, Проезд<br />Аэропорта, 8</SectionTitle>

      <div className="grid grid-cols-[1fr_1.4fr] gap-16">
        <div className="flex flex-col gap-4">
          <Reveal mode="up" delay={120}>
            <div className="flex items-center gap-4 font-sans text-h5 text-base-800">
              <IconPhone size={22} />
              <span>+7 (495) 021-11-11</span>
            </div>
          </Reveal>
          <Reveal mode="up" delay={200}>
            <Pressable
              rippleColor="rgba(255,255,255,0.25)"
              className="mt-6 flex h-14 w-fit items-center gap-3 bg-base-800 px-7 font-sans text-body font-medium text-base-0"
            >
              <IconMap size={18} />
              Проложить маршрут
            </Pressable>
          </Reveal>
        </div>

        <Reveal mode="right" delay={200}>
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-base-100">
            <img
              src="/images/hero-genplan.png"
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
// Section: Документация
// ─────────────────────────────────────────────────────────────────────────────

function Documents() {
  return (
    <section className={`${PAGE_PAD} ${SECTION_PAD_Y}`}>
      <SectionTitle kicker="Документация">Проектная<br />документация<br />на ДОМ.РФ</SectionTitle>

      <div className="grid grid-cols-[1.4fr_auto] items-end gap-16">
        <Reveal mode="up" delay={120}>
          <p className="font-sans text-h5 leading-relaxed text-base-700">
            Актуальные планы, разрешения, проектные декларации и другие официальные
            материалы для детального изучения.
          </p>
        </Reveal>

        <Reveal mode="up" delay={200}>
          <Pressable
            rippleColor="rgba(255,255,255,0.25)"
            className="flex h-14 items-center gap-3 bg-base-800 px-7 font-sans text-body font-medium text-base-0"
          >
            <IconHome size={18} />
            Изучить документы
            <IconArrowRight size={18} />
          </Pressable>
        </Reveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────────────────────

function PageFooter() {
  return (
    <footer className={`border-t border-base-200 ${PAGE_PAD} py-10`}>
      <div className="flex items-center gap-6 font-sans text-small text-base-600">
        <span>© Capital Group · {new Date().getFullYear()}</span>
        <span className="h-1 w-1 rounded-full bg-base-200" />
        <a href="https://cg-projects.ru" onClick={(e) => e.preventDefault()} className="hover:text-base-800">
          cg-projects.ru
        </a>
      </div>
    </footer>
  );
}
