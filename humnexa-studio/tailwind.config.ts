import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          or: "#FF6B2C",
          gr: "#22c55e",
          bg: "#060810",
          surf: "#0d1117",
          card: "#111827",
          card2: "#161d2c",
          border: "#1e2d45",
          text: "#f1f5f9",
          sub: "#94a3b8",
          muted: "#4b5e78",
          warn: "#f59e0b",
          error: "#ef4444",
          info: "#38bdf8",
          purple: "#a855f7",
        },
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #FF6B2C 0%, #f59e0b 100%)",
        "india-gradient":
          "linear-gradient(135deg, #22c55e 0%, #14b8a6 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
