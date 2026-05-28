import { useEffect, useState } from "react";

interface MenuItem {
  id: string;
  label: string;
  /** Hidden from the rendered list but kept here so it can be re-enabled later. */
  hidden?: boolean;
}

const ITEMS: MenuItem[] = [
  { id: "hero", label: "О проекте" },
  { id: "genplan", label: "Генплан" },
  { id: "tour", label: "Виртуальный тур" },
  { id: "special-formats", label: "Особые форматы" },
  { id: "engineering", label: "Инженерия" },
  { id: "construction", label: "Динамика строительства" },
  // Placeholder section, kept in code so it can be re-enabled when ready.
  { id: "buying", label: "Способы покупки", hidden: true },
  { id: "office", label: "Офис продаж" },
  { id: "documents", label: "Документы" },
];

/**
 * Bottom-left collapsible navigation for the About page, modelled on the
 * Figma reference: «МАСТЕРС / CG» header, dark Imperial Night chrome, current
 * section dimmed, taps scroll smoothly to anchored sections.
 */
export function AboutMenu() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>("hero");

  // Track current section in viewport using IntersectionObserver.
  useEffect(() => {
    const sections = ITEMS.map((i) => document.getElementById(i.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (sections.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the top of viewport that is intersecting.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const onPick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setOpen(false);
    }
  };

  const visibleItems = ITEMS.filter((i) => !i.hidden);

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 z-50 w-[420px] max-w-full">
      {/* Drawer panel — slides up from above the bar */}
      <div
        className={`pointer-events-auto overflow-hidden bg-night-500 text-base-0 transition-[max-height,opacity] duration-300 ease-out ${
          open ? "max-h-[720px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {/* Logo block */}
        <div className="flex items-center justify-between px-9 pb-2 pt-9">
          <span className="font-display text-[28px] font-semibold uppercase leading-none tracking-[-0.02em]">
            МАСТЕРС
          </span>
          <span className="grid h-9 w-9 place-items-center border border-base-0 text-base-0">
            <span className="font-display text-[11px] font-bold leading-none tracking-[-0.02em]">
              CG
            </span>
          </span>
        </div>

        {/* Nav list */}
        <nav className="flex flex-col px-9 py-8">
          {visibleItems.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onPick(item.id)}
                className={`py-3 text-left font-sans text-[18px] font-medium transition-colors ${
                  isActive ? "text-base-0/45 cursor-default" : "text-base-0 hover:text-base-0/80"
                }`}
                disabled={isActive}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Toggle bar — always visible */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto flex h-14 w-full items-center justify-between bg-night-500 px-9 font-sans text-body font-medium text-base-0 transition-colors hover:bg-night-400"
      >
        <span className="flex items-center gap-3">
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
            <path d="M1 1h16M1 7h16M1 13h16" />
          </svg>
          Меню
        </span>
        <svg
          width="14"
          height="8"
          viewBox="0 0 14 8"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? "" : "rotate-180"}`}
        >
          <path d="M1 1l6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}
