import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { adminAuth } from "@/lib/overlays";

interface NavItem {
  to: string;
  label: string;
  /** Optional indent under a section divider. */
  section?: string;
}

const NAV: NavItem[] = [
  { to: "overlays", label: "Карта секций (обводки)", section: "Главное" },

  { to: "site/header", label: "Шапка сайта", section: "Сайт" },

  { to: "about/hero", label: "Hero / О проекте", section: "Страница «О проекте»" },
  { to: "about/tour", label: "3D-тур" },
  { to: "about/formats", label: "Особые форматы" },
  { to: "about/engineering", label: "Инженерные системы" },
  { to: "about/construction", label: "Динамика — текущая" },
  { to: "about/construction/gallery", label: "Динамика — галерея" },
  { to: "about/office", label: "Офис продаж" },
  { to: "about/documents", label: "Документы" },
];

export function AdminShell() {
  const nav = useNavigate();

  // Group navs by section.
  const groups: { title: string; items: NavItem[] }[] = [];
  for (const item of NAV) {
    if (item.section) {
      groups.push({ title: item.section, items: [item] });
    } else {
      groups[groups.length - 1]?.items.push(item);
    }
  }

  return (
    <div className="flex min-h-screen bg-base-100 text-base-800">
      {/* Sidebar */}
      <aside className="flex w-[300px] flex-shrink-0 flex-col gap-6 border-r border-base-200 bg-base-0 px-5 py-6">
        <div>
          <p className="font-sans text-upper uppercase tracking-[0.3em] text-base-600">
            ЖК МАСТЕРС
          </p>
          <h1 className="mt-1 font-display text-h5 font-semibold">Админ-панель</h1>
        </div>

        <nav className="flex flex-1 flex-col gap-5">
          {groups.map((g, i) => (
            <div key={i} className="flex flex-col gap-1">
              <p className="px-2 font-sans text-upper uppercase tracking-wide text-base-500">
                {g.title}
              </p>
              {g.items.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  className={({ isActive }) =>
                    `block px-2 py-2 font-sans text-body transition-colors ${
                      isActive
                        ? "bg-base-100 font-medium text-base-800"
                        : "text-base-700 hover:bg-base-100"
                    }`
                  }
                  end={it.to === "overlays"}
                >
                  {it.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="mt-auto flex gap-2">
          <button
            onClick={() => nav("/")}
            className="h-10 flex-1 border border-base-200 bg-base-0 px-3 font-sans text-small font-medium hover:bg-base-100"
          >
            На сайт
          </button>
          <button
            onClick={() => {
              adminAuth.clear();
              location.reload();
            }}
            className="h-10 flex-1 border border-base-200 bg-base-0 px-3 font-sans text-small font-medium hover:bg-base-100"
          >
            Выйти
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
