import { useNavigate } from "react-router-dom";
import { Pressable } from "@/components/Pressable";
import { Reveal } from "@/components/Reveal";

interface HeroCard {
  title: string;
  image?: string;
  to: string;
  dark?: boolean;
}

const cards: HeroCard[] = [
  { title: "О проекте", image: "/images/hero-about.png", to: "/about" },
  { title: "Выбрать квартиру", image: "/images/hero-choose.png", to: "/catalog" },
  { title: "Генплан", image: "/images/hero-genplan.png", to: "/genplan" },
  { title: "3D-тур", to: "/tour", dark: true },
];

export function HeroScreen() {
  const nav = useNavigate();
  return (
    <div className="grid h-full w-full grid-cols-3">
      <Reveal mode="up" delay={0} className="h-full">
        <Card card={cards[0]} onClick={() => nav(cards[0].to)} />
      </Reveal>
      <Reveal mode="up" delay={120} className="h-full">
        <Card card={cards[1]} onClick={() => nav(cards[1].to)} />
      </Reveal>
      <div className="grid grid-rows-2">
        <Reveal mode="up" delay={240} className="h-full">
          <Card card={cards[2]} onClick={() => nav(cards[2].to)} />
        </Reveal>
        <Reveal mode="up" delay={360} className="h-full">
          <Card card={cards[3]} onClick={() => nav(cards[3].to)} />
        </Reveal>
      </div>
    </div>
  );
}

function Card({ card, onClick }: { card: HeroCard; onClick: () => void }) {
  const ripple = card.dark ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.4)";
  return (
    <Pressable
      onClick={onClick}
      rippleColor={ripple}
      className="group block h-full w-full text-left"
      style={card.dark ? { backgroundColor: "#19212C" } : undefined}
    >
      {card.image && (
        <img
          src={card.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
        />
      )}
      {card.dark && (
        <div className="absolute inset-0 grid place-items-center">
          <CubeMark />
        </div>
      )}

      {/* Subtle gradient for legibility on photo cards */}
      {card.image && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10" />
      )}

      <span className="absolute left-9 top-9 z-10 font-display text-[28px] font-medium leading-none tracking-tight text-base-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
        {card.title}
      </span>

      <ArrowUpRight className="absolute bottom-9 right-9 z-10 text-base-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Pressable>
  );
}

function ArrowUpRight({ className = "" }: { className?: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

function CubeMark() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-base-0/35"
    >
      <path d="m21 16-9 5-9-5V8l9-5 9 5z" />
      <path d="M3.27 8 12 13l8.73-5" />
      <path d="M12 22V13" />
    </svg>
  );
}
