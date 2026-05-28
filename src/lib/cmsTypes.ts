// Content-block shapes shared between admin forms and the public page.
// Each interface mirrors what its corresponding admin section saves.

export interface SiteHeaderContent {
  phone: string;
  phoneHref: string;
  brand: string;
  brandLine: string;
  menuItems: { label: string; href: string }[];
}

export interface MetaRow {
  label: string;
  value: string;
  dim?: boolean;
}

export interface CtaTile {
  title: string;
  sub: string;
  url: string;
  icon: "play" | "arrow";
}

export interface AboutHeroContent {
  title: string;
  metaRows: MetaRow[];
  photo: string;
  ctaTiles: CtaTile[];
}

export interface AboutTourContent {
  eyebrow: string;
  paragraphs: string[];
  thumbImage: string;
  ctaLabel: string;
  ctaUrl: string;
}

export interface AboutEngineeringContent {
  eyebrow: string;
  heading: string;
  paragraphs: string[];
  photo: string;
  ctaLabel: string;
  ctaUrl: string;
}

export interface AboutConstructionContent {
  building: string;
  period: string;
  intro: string;
  bullets: string[];
  photo: string;
  galleryLabel: string;
  galleryUrl: string;
}

export interface AboutOfficeContent {
  title: string;
  address: string;
  phone: string;
  photo: string;
  mapImage: string;
  ctaLabel: string;
  routeUrl: string;
}

export interface AboutDocumentsContent {
  eyebrow: string;
  body: string;
  logo: string;
  ctaLabel: string;
  docsUrl: string;
}

// Defaults — kept here so both admin (initial form values) and public
// (fallback when API returns null) read the same source of truth.

export const SITE_HEADER_DEFAULTS: SiteHeaderContent = {
  phone: "+7 (495) 021-11-11",
  phoneHref: "tel:+74950211111",
  brand: "Capital Group",
  brandLine: "CG",
  menuItems: [
    { label: "Выбрать квартиру", href: "/catalog" },
    { label: "О компании", href: "#" },
    { label: "Контакты", href: "#" },
  ],
};

export const ABOUT_HERO_DEFAULTS: AboutHeroContent = {
  title: "Премиальный\nдом МАСТЕРС",
  metaRows: [
    { label: "Класс жилья", value: "Премиум" },
    { label: "Срок сдачи", value: "IV кв. 2029 г.", dim: true },
    { label: "Адрес", value: "г. Москва, ул. Викторенко, 16" },
    {
      label: "О проекте",
      value:
        "МАСТЕРС у метро Аэропорт — ансамбль разновысотных секций от 8 до 25 этажей. Приватный двор и линейный парк с амфитеатром. Клубная гостиная с камином и коворкинг только для резидентов.",
    },
  ],
  photo: "/images/hero-genplan.png",
  ctaTiles: [
    { title: "Видео о проекте", sub: "Узнайте больше", url: "", icon: "play" },
    { title: "Сайт проекта", sub: "Перейти на сайт", url: "", icon: "arrow" },
  ],
};

export const ABOUT_TOUR_DEFAULTS: AboutTourContent = {
  eyebrow: "Виртуальный тур",
  paragraphs: [
    "Взгляните на район дома «Мастерс» с нового ракурса в нашем интерактивном 3D-туре. Переключайтесь между дневным и вечерним временем, чтобы оценить панорамные виды Петровского парка, стадиона «ВЭБ Арена» и делового центра Москва-Сити.",
    "Это уникальный шанс изучить среду, масштаб и перспективы будущего дома, прежде чем сделать решающий выбор.",
  ],
  thumbImage: "/images/about/tour-thumb.png",
  ctaLabel: "Смотреть 3D тур",
  ctaUrl: "/tour",
};

export const ABOUT_ENGINEERING_DEFAULTS: AboutEngineeringContent = {
  eyebrow: "Мастерство в деталях",
  heading: "Инженерные\nсистемы",
  paragraphs: [
    "В квартирах предусмотрены естественная вентиляция через открывающиеся створки и приточные клапаны, а также центральная система кондиционирования — остаётся установить только внутренний блок. Вода проходит многоступенчатую очистку (механическая фильтрация, умягчение и тонкая очистка).",
    "Предусмотрены повышенные электрические мощности, а для квартир с террасами — дополнительные. В лобби и общественных зонах поддерживается комфортный микроклимат, горячая вода подаётся сразу благодаря рециркуляции. Для удобства жителей доступен Wi-Fi в лобби и на придомовой территории, а связь усилена в паркинге и лифтах.",
  ],
  photo: "/images/about/engineering.png",
  ctaLabel: "Заказать звонок",
  ctaUrl: "",
};

export const ABOUT_CONSTRUCTION_DEFAULTS: AboutConstructionContent = {
  building: "Корпус 2",
  period: "Август 2025",
  intro:
    "В августе работы были сконцентрированы на возведении вертикальных конструкций и подготовке к монтажу уникальных фасадных решений.",
  bullets: [
    "Монолитные работы: заливка колонн и плит перекрытий с 8-го по 12-й этажи.",
    "Фасадные работы: подготовка к монтажу алюминиевых панелей и элементов остекления.",
    "Начало работ по формированию ландшафта.",
  ],
  photo: "/images/about/construction.png",
  galleryLabel: "Смотреть галерею",
  galleryUrl: "",
};

export const ABOUT_OFFICE_DEFAULTS: AboutOfficeContent = {
  title: "Офис продаж\n«Мастерс»",
  address: "г. Москва, Проезд Аэропорта, 8",
  phone: "+7 (495) 021-11-11",
  photo: "/images/about/office.png",
  mapImage: "/images/about/office-map.png",
  ctaLabel: "Проложить маршрут",
  routeUrl: "https://yandex.ru/maps/?text=Москва Проезд Аэропорта 8",
};

export const ABOUT_DOCUMENTS_DEFAULTS: AboutDocumentsContent = {
  eyebrow: "Документы",
  body: "Вся проектная документация доступна на официальном портале ДОМ.РФ. Здесь вы найдёте актуальные планы, разрешения, проектные декларации и другие официальные материалы для детального изучения.",
  logo: "",
  ctaLabel: "Изучить документы",
  docsUrl:
    "https://%D0%BD%D0%B0%D1%88.%D0%B4%D0%BE%D0%BC.%D1%80%D1%84/%D1%81%D0%B5%D1%80%D0%B2%D0%B8%D1%81%D1%8B/%D0%BA%D0%B0%D1%82%D0%B0%D0%BB%D0%BE%D0%B3-%D0%BD%D0%BE%D0%B2%D0%BE%D1%81%D1%82%D1%80%D0%BE%D0%B5%D0%BA/%D0%BE%D0%B1%D1%8A%D0%B5%D0%BA%D1%82/70548",
};
