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

export function AboutScreen() {
  const nav = useNavigate();
  return (
    <div className="relative h-full w-full overflow-hidden bg-base-0">
      <Pressable
        onClick={() => nav("/")}
        rippleColor="rgba(0,0,0,0.12)"
        className="absolute right-9 top-9 z-50 grid h-14 w-14 place-items-center bg-base-0/95 text-base-800 shadow-card backdrop-blur-md"
        aria-label="Закрыть"
      >
        <IconClose size={22} />
      </Pressable>

      <div className="h-full w-full overflow-y-auto" style={{ scrollBehavior: "smooth" }}>
        <Hero />
        <ProjectIntro />
        <GenplanTeaser />
        <TourTeaser />
        <SpecialFormats />
        <CatalogTeaser />
        <Engineering />
        <Construction />
        <Office />
        <Documents />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function Hero() {
  const bgRef = useParallax<HTMLDivElement>(0.3);
  return (
    <section className="relative h-[1080px] w-full overflow-hidden bg-night-500 text-base-0">
      <div ref={bgRef} className="absolute inset-0 -top-[5%] h-[110%]">
        <img
          src="/images/tour-scene.png"
          alt=""
          className="h-full w-full object-cover opacity-95"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-black/70" />

      <div className="relative z-10 flex h-full flex-col justify-between p-16">
        <Reveal mode="up" delay={50}>
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center bg-base-0 text-base-800">
              <span className="font-display text-[22px] font-bold leading-none">M</span>
            </div>
            <span className="font-display text-[14px] font-medium uppercase tracking-[0.3em]">
              Capital Group · ЖК Мастерс
            </span>
          </div>
        </Reveal>

        <div className="max-w-[1320px]">
          <Reveal mode="up" delay={150}>
            <p className="font-sans text-upper uppercase tracking-[0.3em] text-base-0/70">
              Премиум · IV кв. 2029 г. · ул. Викторенко, 16
            </p>
          </Reveal>
          <Reveal mode="up" delay={250}>
            <h1 className="mt-6 font-display text-[112px] font-semibold leading-[0.95] tracking-[-0.02em]">
              Премиальный
              <br />
              дом МАСТЕРС
            </h1>
          </Reveal>
          <Reveal mode="up" delay={400}>
            <p className="mt-8 max-w-[920px] font-sans text-h4 text-base-0/85">
              МАСТЕРС у метро Аэропорт — ансамбль разновысотных секций от 8 до 25 этажей.
              Приватный двор и линейный парк с амфитеатром. Клубная гостиная с камином
              и коворкинг только для резидентов.
            </p>
          </Reveal>
          <Reveal mode="up" delay={520}>
            <div className="mt-10 flex items-center gap-3">
              <Pressable
                rippleColor="rgba(255,255,255,0.25)"
                className="flex h-14 items-center gap-3 bg-base-0 px-7 font-sans text-body font-medium text-base-800"
              >
                <IconPlay size={18} />
                Видео о проекте
              </Pressable>
              <Pressable
                rippleColor="rgba(255,255,255,0.15)"
                className="flex h-14 items-center gap-3 border border-base-0/40 bg-transparent px-7 font-sans text-body font-medium text-base-0"
              >
                Сайт проекта
                <IconArrowRight size={18} />
              </Pressable>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function ProjectIntro() {
  const stats = [
    { value: "8–25", unit: "этажей" },
    { value: "5", unit: "секций" },
    { value: "3,0–3,1 м", unit: "потолки" },
    { value: "IV кв. 2029", unit: "сдача" },
  ];
  return (
    <section className="bg-base-0 py-32">
      <div className="mx-auto max-w-[1640px] px-16">
        <Reveal mode="up">
          <p className="font-sans text-upper uppercase tracking-[0.3em] text-accent">О проекте</p>
        </Reveal>
        <Reveal mode="up" delay={120}>
          <h2 className="mt-6 max-w-[1200px] font-display text-[64px] font-semibold leading-[1.05] tracking-tight text-base-800">
            Дом для тех, кто ценит приватность в центре столицы
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-4 gap-10 border-t border-base-200 pt-12">
          {stats.map((s, i) => (
            <Reveal key={s.unit} mode="up" delay={i * 100}>
              <div>
                <div className="font-display text-[56px] font-semibold leading-none tracking-tight text-base-800">
                  {s.value}
                </div>
                <div className="mt-3 font-sans text-body uppercase tracking-[0.15em] text-base-600">
                  {s.unit}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function GenplanTeaser() {
  const nav = useNavigate();
  return (
    <Teaser
      bg="/images/hero-genplan.png"
      kicker="Генплан проекта"
      title="Двор без машин и линейный парк с амфитеатром"
      desc="5 секций ансамбля, школа №117 и детский сад в шаговой доступности, парк «Берёзовая роща», 15 минут до м. ЦСКА и ТЦ «Авиапарк»."
      cta="Открыть генплан"
      onClick={() => nav("/genplan")}
      icon={<IconMap size={18} />}
    />
  );
}

function TourTeaser() {
  const nav = useNavigate();
  return (
    <Teaser
      bg="/images/tour-scene.png"
      kicker="3D-тур"
      title="Посмотрите комплекс в виртуальном пространстве"
      desc="Полноэкранный аэровид комплекса с возможностью свободно осмотреть фасады, дворы и окружение."
      cta="Запустить 3D-тур"
      onClick={() => nav("/tour")}
      icon={<IconCube size={18} />}
      dark
    />
  );
}

function CatalogTeaser() {
  const nav = useNavigate();
  return (
    <Teaser
      bg="/images/hero-choose.png"
      kicker="Планировки"
      title="158 квартир от 41,8 м² с фильтрами по площади и цене"
      desc="1-, 2- и 3-комнатные планировки. Тэги — «Кухня-гостиная», «Гардеробная», «Мастер-спальня». Цена от 37,8 млн ₽."
      cta="Подобрать квартиру"
      onClick={() => nav("/catalog")}
      icon={<IconHome size={18} />}
    />
  );
}

interface TeaserProps {
  bg: string;
  kicker: string;
  title: string;
  desc: string;
  cta: string;
  onClick: () => void;
  icon: React.ReactNode;
  dark?: boolean;
}

function Teaser({ bg, kicker, title, desc, cta, onClick, icon, dark = false }: TeaserProps) {
  const bgRef = useParallax<HTMLDivElement>(0.18);
  return (
    <section
      className={`relative h-[700px] w-full overflow-hidden ${dark ? "bg-night-500 text-base-0" : "bg-base-100 text-base-800"}`}
    >
      <div ref={bgRef} className="absolute inset-0 -top-[5%] h-[110%]">
        <img src={bg} alt="" className="h-full w-full object-cover opacity-90" />
      </div>
      <div
        className={`absolute inset-0 ${dark ? "bg-gradient-to-r from-night-500 via-night-500/70 to-transparent" : "bg-gradient-to-r from-base-100 via-base-100/70 to-transparent"}`}
      />

      <div className="relative z-10 grid h-full grid-cols-2 px-16">
        <div className="flex flex-col justify-center">
          <Reveal mode="up">
            <p
              className={`font-sans text-upper uppercase tracking-[0.3em] ${dark ? "text-base-0/70" : "text-accent"}`}
            >
              {kicker}
            </p>
          </Reveal>
          <Reveal mode="up" delay={120}>
            <h2
              className={`mt-6 max-w-[640px] font-display text-[56px] font-semibold leading-tight tracking-tight ${dark ? "" : "text-base-800"}`}
            >
              {title}
            </h2>
          </Reveal>
          <Reveal mode="up" delay={220}>
            <p
              className={`mt-6 max-w-[600px] font-sans text-h5 ${dark ? "text-base-0/85" : "text-base-600"}`}
            >
              {desc}
            </p>
          </Reveal>
          <Reveal mode="up" delay={320}>
            <Pressable
              onClick={onClick}
              rippleColor="rgba(255,255,255,0.25)"
              className="mt-10 flex h-14 w-fit items-center gap-3 bg-accent px-8 font-sans text-body font-medium text-base-0"
            >
              {icon}
              {cta}
              <IconArrowRight size={18} />
            </Pressable>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

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
    <section className="bg-base-100 py-32">
      <div className="mx-auto max-w-[1640px] px-16">
        <Reveal mode="up">
          <p className="font-sans text-upper uppercase tracking-[0.3em] text-accent">
            Особые форматы
          </p>
        </Reveal>
        <Reveal mode="up" delay={120}>
          <h2 className="mt-6 max-w-[1200px] font-display text-[56px] font-semibold leading-tight tracking-tight text-base-800">
            Планировки, которых нет у соседей
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-3 gap-5">
          {items.map((it, i) => (
            <Reveal key={it.title} mode="up" delay={(i % 3) * 100}>
              <div className="flex h-[340px] flex-col bg-base-0 p-10 transition-colors hover:bg-night-500 hover:text-base-0">
                <div className="font-display text-[44px] font-semibold leading-none tracking-tight tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="mt-auto">
                  <h3 className="font-display text-h4 font-semibold leading-tight">{it.title}</h3>
                  <p className="mt-3 font-sans text-body text-base-600">{it.note}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Engineering() {
  const bgRef = useParallax<HTMLDivElement>(0.25);
  return (
    <section className="relative h-[700px] w-full overflow-hidden bg-night-500 text-base-0">
      <div ref={bgRef} className="absolute inset-0 -top-[5%] h-[110%]">
        <img
          src="/images/hero-about.png"
          alt=""
          className="h-full w-full object-cover opacity-50"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-night-500 via-night-500/80 to-transparent" />

      <div className="relative z-10 grid h-full grid-cols-2 px-16">
        <div className="flex flex-col justify-center">
          <Reveal mode="up">
            <p className="font-sans text-upper uppercase tracking-[0.3em] text-base-0/70">
              Инженерные системы
            </p>
          </Reveal>
          <Reveal mode="up" delay={120}>
            <h2 className="mt-6 font-display text-[56px] font-semibold leading-tight tracking-tight">
              Незаметный комфорт
            </h2>
          </Reveal>
          <Reveal mode="up" delay={220}>
            <p className="mt-8 max-w-[640px] font-sans text-h5 text-base-0/85">
              Приточно-вытяжная вентиляция с подогревом, индивидуальные тепловые узлы,
              бесперебойное водоснабжение с трёхступенчатой очисткой, резервное
              электропитание и Wi-Fi покрытие во всех общественных зонах.
            </p>
          </Reveal>
          <Reveal mode="up" delay={320}>
            <div className="mt-10 flex items-center gap-3">
              <Pressable
                rippleColor="rgba(255,255,255,0.25)"
                className="flex h-14 items-center gap-3 bg-accent px-8 font-sans text-body font-medium text-base-0"
              >
                Консультация
                <IconArrowRight size={18} />
              </Pressable>
              <Pressable
                rippleColor="rgba(255,255,255,0.15)"
                className="flex h-14 items-center gap-3 border border-base-0/40 bg-transparent px-8 font-sans text-body font-medium text-base-0"
              >
                Заказать звонок
              </Pressable>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Construction() {
  return (
    <section className="bg-base-0 py-32">
      <div className="mx-auto max-w-[1640px] px-16">
        <div className="grid grid-cols-[1fr_auto] items-end">
          <div>
            <Reveal mode="up">
              <p className="font-sans text-upper uppercase tracking-[0.3em] text-accent">
                Динамика строительства
              </p>
            </Reveal>
            <Reveal mode="up" delay={120}>
              <h2 className="mt-6 max-w-[1100px] font-display text-[56px] font-semibold leading-tight tracking-tight text-base-800">
                Август 2025 · Возведение вертикальных конструкций
              </h2>
            </Reveal>
          </div>
          <Reveal mode="up" delay={200}>
            <div className="flex items-center gap-3">
              <span className="flex h-12 items-center bg-base-100 px-5 font-sans text-body font-medium text-base-700">
                Корпус 1
              </span>
              <span className="flex h-12 items-center bg-base-100 px-5 font-sans text-body font-medium text-base-700">
                Август 2025
              </span>
            </div>
          </Reveal>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-12">
          <Reveal mode="left" delay={150}>
            <ul className="divide-y divide-base-200">
              {[
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
              ].map((it) => (
                <li key={it.k} className="grid grid-cols-[280px_1fr] gap-8 py-6">
                  <span className="font-display text-h5 font-semibold text-base-800">{it.k}</span>
                  <span className="font-sans text-body text-base-600">{it.v}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal mode="right" delay={250}>
            <div className="relative h-[540px] overflow-hidden bg-base-100">
              <img
                src="/images/hero-choose.png"
                alt="Фото со стройплощадки"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </Reveal>
        </div>

        <Reveal mode="up" delay={400}>
          <Pressable
            rippleColor="rgba(0,0,0,0.1)"
            className="mt-12 inline-flex h-14 items-center gap-3 bg-base-800 px-8 font-sans text-body font-medium text-base-0"
          >
            Смотреть галерею
            <IconArrowRight size={18} />
          </Pressable>
        </Reveal>
      </div>
    </section>
  );
}

function Office() {
  return (
    <section className="relative h-[640px] w-full overflow-hidden bg-base-100">
      <div className="absolute inset-y-0 right-0 w-[55%]">
        <img
          src="/images/hero-genplan.png"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-base-100 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 grid h-full max-w-[1640px] grid-cols-2 px-16">
        <div className="flex flex-col justify-center">
          <Reveal mode="up">
            <p className="font-sans text-upper uppercase tracking-[0.3em] text-accent">
              Офис продаж «Мастерс»
            </p>
          </Reveal>
          <Reveal mode="up" delay={120}>
            <h2 className="mt-6 font-display text-[52px] font-semibold leading-tight tracking-tight text-base-800">
              Москва, Проезд Аэропорта, 8
            </h2>
          </Reveal>
          <Reveal mode="up" delay={220}>
            <div className="mt-8 flex items-center gap-4 font-sans text-h5 text-base-700">
              <IconPhone size={22} />
              <span>+7 (495) 021-11-11</span>
            </div>
          </Reveal>
          <Reveal mode="up" delay={320}>
            <Pressable
              rippleColor="rgba(255,255,255,0.3)"
              className="mt-10 inline-flex h-14 w-fit items-center gap-3 bg-accent px-8 font-sans text-body font-medium text-base-0"
            >
              <IconMap size={18} />
              Проложить маршрут
            </Pressable>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Documents() {
  return (
    <section className="bg-night-500 py-32 text-base-0">
      <div className="mx-auto max-w-[1640px] px-16">
        <div className="grid grid-cols-[1fr_auto] items-end gap-10">
          <div>
            <Reveal mode="up">
              <p className="font-sans text-upper uppercase tracking-[0.3em] text-base-0/70">
                Документация
              </p>
            </Reveal>
            <Reveal mode="up" delay={120}>
              <h2 className="mt-6 max-w-[1100px] font-display text-[52px] font-semibold leading-tight tracking-tight">
                Вся проектная документация на портале ДОМ.РФ
              </h2>
            </Reveal>
            <Reveal mode="up" delay={220}>
              <p className="mt-8 max-w-[860px] font-sans text-h5 text-base-0/70">
                Актуальные планы, разрешения, проектные декларации и другие официальные
                материалы для детального изучения.
              </p>
            </Reveal>
          </div>
          <Reveal mode="up" delay={300}>
            <Pressable
              rippleColor="rgba(255,255,255,0.2)"
              className="flex h-16 items-center gap-3 bg-base-0 px-10 font-sans text-h5 font-medium text-base-800"
            >
              Изучить документы
              <IconArrowRight size={22} />
            </Pressable>
          </Reveal>
        </div>

        <div className="mt-20 flex items-center gap-6 border-t border-base-0/15 pt-10 font-sans text-small text-base-0/60">
          <span>© Capital Group · {new Date().getFullYear()}</span>
          <span className="h-1 w-1 rounded-full bg-base-0/30" />
          <a
            href="https://cg-projects.ru"
            className="hover:text-base-0"
            onClick={(e) => e.preventDefault()}
          >
            cg-projects.ru
          </a>
          <button
            onClick={() => {
              const stage = document.querySelector(".stage .overflow-y-auto");
              stage?.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="ml-auto flex h-12 items-center gap-3 border border-base-0/30 px-5 font-sans text-body text-base-0 transition-colors hover:bg-base-0 hover:text-base-800"
          >
            Наверх
            <IconCube size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
