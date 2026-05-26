import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 24, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconClose = (p: IconProps) => (
  <Base {...p}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Base>
);

export const IconArrowRight = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </Base>
);

export const IconChevronLeft = (p: IconProps) => (
  <Base {...p}>
    <path d="m15 18-6-6 6-6" />
  </Base>
);

export const IconChevronRight = (p: IconProps) => (
  <Base {...p}>
    <path d="m9 18 6-6-6-6" />
  </Base>
);

export const IconPlay = (p: IconProps) => (
  <Base {...p}>
    <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" />
  </Base>
);

export const IconCube = (p: IconProps) => (
  <Base {...p}>
    <path d="m21 16-9 5-9-5V8l9-5 9 5z" />
    <path d="M3.27 8 12 13l8.73-5" />
    <path d="M12 22V13" />
  </Base>
);

export const IconMap = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 6v15l6-3 6 3 6-3V3l-6 3-6-3-6 3z" />
    <path d="M9 3v15" />
    <path d="M15 6v15" />
  </Base>
);

export const IconHome = (p: IconProps) => (
  <Base {...p}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </Base>
);

export const IconHeart = (p: IconProps) => (
  <Base {...p}>
    <path d="M19 14c1.5-1.5 3-3.5 3-6a4 4 0 0 0-7-2.5A4 4 0 0 0 8 5.5c0 2.5 1.5 4.5 3 6l6 6Z" />
  </Base>
);

export const IconPhone = (p: IconProps) => (
  <Base {...p}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
  </Base>
);

export const IconInfo = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </Base>
);
