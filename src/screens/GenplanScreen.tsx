import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { OverlayChrome } from "@/components/OverlayChrome";
import { Pressable } from "@/components/Pressable";
import { GenplanCanvas } from "@/components/GenplanCanvas";
import { getHouse, ROOM_TYPES } from "@/data/complex";
import { IconCube, IconMap } from "@/components/Icon";
import type { RoomType, Apartment } from "@/data/types";

export function GenplanScreen() {
  const nav = useNavigate();
  const house = getHouse();

  const [rooms, setRooms] = useState<Set<RoomType>>(new Set());

  // A section is visible iff it has apartments matching the room filter.
  // Sections not in the feed yet are visible only when no filter is applied,
  // because we can't verify them against criteria.
  const sectionVisible = (sectionNumber: number): boolean => {
    const section = house.sections.find((s) => s.number === sectionNumber);
    if (!section) {
      return rooms.size === 0;
    }
    if (rooms.size === 0) return true;
    const apts: Apartment[] = Object.values(section.apartmentsByFloor).flat();
    return apts.some((a) => rooms.has(a.roomType));
  };

  const openCatalog = (sectionNumber: number) => {
    const params = new URLSearchParams();
    params.set("section", String(sectionNumber));
    if (rooms.size > 0) params.set("rooms", Array.from(rooms).join(","));
    nav(`/catalog?${params.toString()}`);
  };

  const toggleRoom = (rt: RoomType) =>
    setRooms((prev) => {
      const next = new Set(prev);
      next.has(rt) ? next.delete(rt) : next.add(rt);
      return next;
    });

  return (
    <div className="relative h-full w-full bg-night-500">
      <GenplanCanvas
        showOverlays
        onSectionPick={openCatalog}
        isSectionVisible={sectionVisible}
        labelOffsets={{ "5": [40, 0] }}
      />

      <OverlayChrome />

      {/* Bottom-left — room filter chips. z-30 above overlay SVGs.
        * No Reveal wrapper — IntersectionObserver is unreliable on the scaled stage. */}
      <div className="absolute bottom-10 left-10 z-30">
        <div className="flex flex-wrap items-center gap-2">
          {ROOM_TYPES.map((rt) => {
            const active = rooms.has(rt.key);
            return (
              <Pressable
                key={rt.key}
                onClick={() => toggleRoom(rt.key)}
                rippleColor={active ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.08)"}
                className={`h-12 px-5 font-sans text-body font-medium transition-colors ${
                  active
                    ? "bg-night-500 text-base-0"
                    : "border border-base-200 bg-base-0/95 text-base-800"
                }`}
              >
                {rt.label}
              </Pressable>
            );
          })}
        </div>
      </div>

      {/* Bottom-right — disabled infrastructure toggle + 3D-tour. */}
      <div className="absolute bottom-10 right-10 z-30">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 items-center gap-3 bg-base-0/95 px-5 font-sans text-body font-medium text-base-800 backdrop-blur-sm"
            aria-disabled="true"
            title="Скоро"
          >
            <IconMap size={18} className="opacity-40" />
            <span className="opacity-60">Инфраструктура</span>
            <span
              className="relative inline-block h-5 w-9 rounded-full bg-base-200"
              aria-hidden="true"
            >
              <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-base-0 shadow-card" />
            </span>
          </div>

          <Pressable
            onClick={() => nav("/tour")}
            rippleColor="rgba(0,0,0,0.12)"
            className="flex h-12 items-center gap-3 bg-base-0/95 px-5 font-sans text-body font-medium text-base-800 backdrop-blur-sm"
          >
            <IconCube size={18} />
            3D-тур
          </Pressable>
        </div>
      </div>
    </div>
  );
}
