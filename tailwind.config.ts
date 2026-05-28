import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          0: "#FFFFFF",
          100: "#F1F2F4",
          200: "#E3E4E8",
          600: "#444955",
          700: "#2D3139",
          800: "#17181C",
        },
        night: {
          400: "#374962",
          500: "#19212C",
        },
        accent: {
          DEFAULT: "#0061A6",
          500: "#0061A6",
        },
      },
      fontFamily: {
        // Headings & eyebrows — RF Dewi Expanded (matches Figma «О проекте»
        // styles). We only ship the Ultrabold cut, so all weights render at
        // 800 via the font-face declaration in index.css.
        display: ["'RF Dewi Expanded'", "'RF Dewi Extended'", "system-ui", "sans-serif"],
        displayExtended: ["'RF Dewi Extended'", "system-ui", "sans-serif"],
        // Body text — Graphik LC Web (multiple weights available).
        sans: ["'Graphik LC Web'", "system-ui", "sans-serif"],
      },
      fontSize: {
        h1: ["64px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        h2: ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        h3: ["32px", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
        h4: ["24px", { lineHeight: "1.16", letterSpacing: "-0.015em" }],
        h5: ["18px", { lineHeight: "1.16", letterSpacing: "-0.01em" }],
        body: ["16px", { lineHeight: "1.16", letterSpacing: "-0.008em" }],
        small: ["14px", { lineHeight: "1.16", letterSpacing: "-0.006em" }],
        upper: ["12px", { lineHeight: "1", letterSpacing: "-0.02em" }],
      },
      borderRadius: {
        card: "20px",
      },
      boxShadow: {
        card: "0px 0px 1px rgba(15,22,38,0.04), 0px 2px 6px rgba(15,22,38,0.04), 0px 16px 24px rgba(15,22,38,0.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;
