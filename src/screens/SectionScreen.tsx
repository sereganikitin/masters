import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { OverlayChrome } from "@/components/OverlayChrome";
import { RoomFilter } from "@/components/RoomFilter";
import { Reveal } from "@/components/Reveal";
import { Pressable } from "@/components/Pressable";
import { OverlayLayer } from "@/components/OverlayLayer";
import { getSection } from "@/data/complex";
import type { RoomType } from "@/data/types";
import type { Overlay } from "@/lib/overlays";

export function SectionScreen() {
  const { sectionNumber } = useParams();
  const nav = useNavigate();
  const num = Number(sectionNumber);
  const section = getSection(num);
  const [filter, setFilter] = useState<RoomType | "all">("all");

  if (!section) {
    return (
      <div className="grid h-full place-items-center bg-base-100">
        <div className="text-center">
          <p className="font-display text-h3">Секция не найдена</p>
          <Pressable
            onClick={() => nav("/genplan")}
            className="mt-6 bg-accent px-6 py-3 font-sans text-body text-base-0"
          >
            К генплану
          </Pressable>
        </div>
      </div>
    );
  }

  // For a floor-overlay, "enabled" means there's at least one apartment of the
  // active room type on that floor. entityId for floor overlays is either
  // "<floor>" or "<section>_<floor>".
  const isFloorEnabled = (o: Overlay) => {
    if (filter === "all") return true;
    const floorNum = o.entityId.includes("_")
      ? Number(o.entityId.split("_")[1])
      : Number(o.entityId);
    if (Number.isNaN(floorNum)) return false;
    const apts = section.apartmentsByFloor[floorNum] ?? [];
    return apts.some((a) => a.roomType === filter);
  };

  return (
    <div className="relative h-full w-full bg-night-500">
      <img
        src="/images/hero-genplan.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/40" />

      <OverlayChrome onBack={() => nav("/genplan")} backLabel="К генплану" />

      {/* Admin-drawn floor overlays, dimmed when not matching room filter */}
      <OverlayLayer
        scope="section"
        scopeKey={String(section.number)}
        isEnabled={isFloorEnabled}
        onPick={(o) => {
          const floor = o.entityId.includes("_")
            ? Number(o.entityId.split("_")[1])
            : Number(o.entityId);
          if (!Number.isNaN(floor)) nav(`/floor/${section.number}/${floor}`);
        }}
      />

      {/* Section title (top-left) — Unbounded H5 UPPER 32px per Figma 13558:78061 */}
      <div className="absolute left-10 top-32 z-10 text-base-0">
        <Reveal mode="up">
          <p className="font-sans text-upper uppercase tracking-[0.25em] text-base-0/70">
            ЖК МАСТЕРС · Корпус 1
          </p>
        </Reveal>
        <Reveal mode="up" delay={100}>
          <h2 className="mt-2 font-display text-[32px] font-semibold uppercase leading-none tracking-[0.02em]">
            {section.number} секция
          </h2>
        </Reveal>
        <Reveal mode="up" delay={200}>
          <p className="mt-3 font-sans text-h5 text-base-0/85">
            {section.apartmentCount} квартир · до {section.highFloor} этажей
          </p>
        </Reveal>
      </div>

      {/* Room filter (bottom-left) — sharp-corner chips per Figma */}
      <RoomFilter
        value={filter}
        onChange={setFilter}
        className="absolute bottom-10 left-10 z-10"
      />
    </div>
  );
}
