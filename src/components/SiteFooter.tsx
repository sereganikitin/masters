// Shared site footer / disclaimer. Rendered at the bottom of every scrollable
// page EXCEPT the main kiosk splash («главная разводящая»). Kiosk fixed screens
// (genplan / apartment / tour) don't scroll, so they carry no footer.

interface SiteFooterProps {
  /** Tailwind horizontal padding to match the host page gutter. */
  pad?: string;
}

export function SiteFooter({ pad = "px-20" }: SiteFooterProps) {
  return (
    <footer
      className={`border-t border-base-200 bg-night-500 ${pad} py-12 text-base-0/55`}
    >
      <div className="flex flex-col gap-6">
        {/* Legal disclaimer */}
        <div className="font-sans text-small leading-relaxed">
          Информация не является публичной офертой
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 font-sans text-small">
          <span>© МАСТЕРС · {new Date().getFullYear()}</span>
          <span>ЖК МАСТЕРС</span>
        </div>
      </div>
    </footer>
  );
}
