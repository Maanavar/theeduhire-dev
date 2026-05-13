import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        eh: {
          primary: {
            50: "#eef3f8",
            100: "#dce6f1",
            200: "#bed3e8",
            300: "#94b9db",
            400: "#5f9bd0",
            500: "#0a66c2",
            600: "#0a66c2",
            700: "#004182",
            800: "#083b73",
            900: "#062d58",
          },
          surface: "#ffffff",
          soft: "#f7f8fa",
          muted: "#eef2f6",
          border: "#e3e8ef",
          text: "#101828",
          text2: "#344054",
          text3: "#667085",
        },
        brand: {
          50:  "#eef3f8",
          100: "#dce6f1",
          200: "#bed3e8",
          300: "#94b9db",
          400: "#5f9bd0",
          500: "#0a66c2",
          600: "#0a66c2",
          700: "#004182",
          800: "#083b73",
          900: "#062d58",
        },
        accent: {
          50:  "#fff7ed",
          100: "#ffedd5",
          400: "#f97316",
          500: "#ea6c0a",
          600: "#c2570a",
        },
        // Semantic surface tokens
        surface: {
          base:   "#f4f6f8",
          raised: "#ffffff",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "'Inter Tight'", "Georgia", "serif"],
        body: ["'Inter Tight'", "'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
        xs:    ["0.75rem",   { lineHeight: "1.125rem" }],
        sm:    ["0.8125rem", { lineHeight: "1.25rem" }],
        base:  ["0.9375rem", { lineHeight: "1.5rem" }],
        md:    ["1rem",      { lineHeight: "1.5rem" }],
        lg:    ["1.125rem",  { lineHeight: "1.625rem" }],
        xl:    ["1.25rem",   { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem",    { lineHeight: "2rem" }],
        "3xl": ["1.875rem",  { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem",   { lineHeight: "2.5rem" }],
        "5xl": ["2.875rem",  { lineHeight: "1.1" }],
        "6xl": ["3.5rem",    { lineHeight: "1.05" }],
      },
      spacing: {
        "4.5": "1.125rem",
        "13":  "3.25rem",
        "15":  "3.75rem",
        "18":  "4.5rem",
        "22":  "5.5rem",
      },
      borderRadius: {
        "xs":  "4px",
        "sm":  "6px",
        "md":  "8px",
        "lg":  "12px",
        "xl":  "16px",
        "2xl": "20px",
        "3xl": "24px",
        "4xl": "32px",
      },
      boxShadow: {
        xs:      "0 1px 2px rgba(0,0,0,0.04)",
        sm:      "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        md:      "0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)",
        lg:      "0 10px 20px -4px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)",
        xl:      "0 20px 40px -8px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.04)",
        "2xl":   "0 32px 64px -16px rgba(0,0,0,0.2)",
        brand:   "0 8px 24px rgba(10,102,194,0.18)",
        "brand-lg": "0 16px 40px rgba(10,102,194,0.22)",
        glass:   "0 8px 32px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.35)",
        inner:   "inset 0 2px 4px rgba(0,0,0,0.04)",
      },
      transitionTimingFunction: {
        spring:  "cubic-bezier(0.34, 1.56, 0.64, 1)",
        smooth:  "cubic-bezier(0.4, 0, 0.2, 1)",
        "ease-out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        "fast": "120ms",
        "base": "200ms",
        "slow": "350ms",
      },
      backgroundImage: {
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        "brand-gradient": "linear-gradient(135deg, #0a66c2 0%, #004182 100%)",
        "hero-radial": "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(10,102,194,0.12) 0%, transparent 65%)",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translate3d(0, 14px, 0)" },
          to:   { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to:   { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up":  "fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both",
        "shimmer":  "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
