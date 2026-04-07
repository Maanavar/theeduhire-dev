import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#D8F3DC",
          100: "#B7E4C7",
          200: "#95D5B2",
          300: "#74C69D",
          400: "#52B788",
          500: "#2D6A4F",
          600: "#1B4332",
          700: "#134D35",
          800: "#0D3B27",
          900: "#081C15",
        },
        accent: {
          50: "#FFF3E6",
          100: "#FFE0B2",
          400: "#E8913A",
          500: "#E07A3A",
          600: "#D47E2F",
        },
      },
      fontFamily: {
        display: ["'Source Serif 4'", "Georgia", "serif"],
        body: ["'Outfit'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
