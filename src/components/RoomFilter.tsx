import { ROOM_TYPES } from "@/data/complex";
import type { RoomType } from "@/data/types";

interface RoomFilterProps {
  value: RoomType | "all";
  onChange: (rt: RoomType | "all") => void;
  className?: string;
}

export function RoomFilter({ value, onChange, className = "" }: RoomFilterProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <FilterChip active={value === "all"} onClick={() => onChange("all")}>
        Все
      </FilterChip>
      {ROOM_TYPES.map((rt) => (
        <FilterChip key={rt.key} active={value === rt.key} onClick={() => onChange(rt.key)}>
          {rt.label}
        </FilterChip>
      ))}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  // Sharp corners per Figma — Imperial Night/500 for active, white + 1px border for inactive.
  return (
    <button
      onClick={onClick}
      className={`h-12 px-5 font-sans text-body font-medium transition-colors ${
        active
          ? "bg-night-500 text-base-0"
          : "border border-base-200 bg-base-0 text-base-800 hover:border-base-600"
      }`}
    >
      {children}
    </button>
  );
}
