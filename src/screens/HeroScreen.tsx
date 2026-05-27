import { useNavigate } from "react-router-dom";
import { Pressable } from "@/components/Pressable";
import { Reveal } from "@/components/Reveal";

// Layout per Figma frame 13558:77979 (cards row 1440×745 → scaled to 1920×1080):
//   Cards row originally 480×745 each (and 480×372.5 for right column halves).
//   On 1920×1080 stage we use 3 columns of 640px each, right column split 540/540.
// Card primitives:
//   - Title:      Graphik H4 / 24px Medium → 32px on stage (scale 1.33×)
//   - Position:   left=20, top=20 (Figma) → left/top 28px on stage
//   - Button:     48×48 in 1440 frame → 64×64 on stage, bottom-right corner with 28px inset
//   - Gradient:   linear 180deg rgba(25,33,44,.3) 0% → transparent 21%
//   - Radius:     0 (sharp corners)
//   - Gap:        0 (cards flush against each other)

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
          <Card card={cards[2]} onClick={() => nav(cards[2].to)} half />
        </Reveal>
        <Reveal mode="up" delay={360} className="h-full">
          <Card card={cards[3]} onClick={() => nav(cards[3].to)} half />
        </Reveal>
      </div>
    </div>
  );
}

function Card({ card, onClick, half = false }: { card: HeroCard; onClick: () => void; half?: boolean }) {
  const ripple = card.dark ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.35)";
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
          <CubeMark size={half ? 118 : 160} />
        </div>
      )}

      {/* Gradient overlay per Figma: from rgba(25,33,44,0.3) at top to transparent ~21%.
        * Stronger at top makes the title readable on bright facade photos. */}
      {card.image && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(25,33,44,0.32) 0%, rgba(25,33,44,0) 22%)",
          }}
        />
      )}

      {/* Title — top-left, Graphik H4 equivalent. */}
      <span className="absolute left-9 top-9 z-10 font-display text-[32px] font-medium leading-[1.16] tracking-[-0.015em] text-base-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
        {card.title}
      </span>

      {/* Corner button — 64×64, white fill + thin border, arrow ↗ inside. */}
      <ArrowButton className="absolute bottom-9 right-9 z-10" />
    </Pressable>
  );
}

function ArrowButton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`grid h-16 w-16 place-items-center border border-base-200 bg-base-0/95 text-base-800 transition-colors duration-200 group-hover:border-transparent group-hover:bg-accent group-hover:text-base-0 ${className}`}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 17 17 7" />
        <path d="M8 7h9v9" />
      </svg>
    </div>
  );
}

function CubeMark({ size = 160 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
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
