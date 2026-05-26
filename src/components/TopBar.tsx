import { useNavigate } from "react-router-dom";
import { IconPhone } from "./Icon";

interface TopBarProps {
  variant?: "light" | "dark";
}

export function TopBar({ variant = "light" }: TopBarProps) {
  const nav = useNavigate();
  const isDark = variant === "dark";

  return (
    <div
      className={`absolute left-0 right-0 top-0 z-20 flex h-[80px] items-center justify-between px-10 ${
        isDark ? "text-base-0" : "text-base-800"
      }`}
    >
      <button onClick={() => nav("/")} className="flex items-center gap-3">
        <div
          className={`grid h-8 w-8 place-items-center rounded-sm ${
            isDark ? "bg-base-0 text-base-800" : "bg-base-800 text-base-0"
          }`}
        >
          <span className="font-display text-[18px] font-bold leading-none">M</span>
        </div>
        <span className="font-display text-[14px] font-medium uppercase tracking-[0.2em]">
          Capital Group
        </span>
      </button>

      <nav className="flex items-center gap-10">
        <button
          onClick={() => nav("/genplan")}
          className="font-sans text-body font-medium transition-opacity hover:opacity-70"
        >
          Выбрать квартиру
        </button>
        <button className="font-sans text-body font-medium transition-opacity hover:opacity-70">
          О компании
        </button>
        <button className="font-sans text-body font-medium transition-opacity hover:opacity-70">
          Контакты
        </button>
      </nav>

      <div className="flex items-center gap-3">
        <IconPhone size={18} />
        <a
          href="tel:+79876543210"
          className="font-sans text-body font-medium tracking-wide"
        >
          +7 987 654-32-10
        </a>
      </div>
    </div>
  );
}
