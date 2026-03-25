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
        primary: {
          50: "#EBF3FB",
          100: "#D7E7F7",
          200: "#AFCFEF",
          300: "#87B7E7",
          400: "#5FA0DF",
          500: "#4A90D9",
          600: "#2E74BD",
          700: "#22578E",
          800: "#173A5F",
          900: "#0B1D30",
        },
        accent: {
          50: "#FFF3EB",
          100: "#FFE7D6",
          200: "#FFCFAD",
          300: "#FFB785",
          400: "#FFA05C",
          500: "#FF8C42",
          600: "#E06A1A",
          700: "#A84F13",
          800: "#70350D",
          900: "#381A06",
        },
        success: {
          50: "#E8F5E9",
          100: "#C8E6C9",
          200: "#A5D6A7",
          300: "#81C784",
          400: "#66BB6A",
          500: "#4CAF50",
          600: "#43A047",
          700: "#388E3C",
          800: "#2E7D32",
          900: "#1B5E20",
        },
        kid: {
          pink: "#FF6B9D",
          purple: "#C084FC",
          yellow: "#FBBF24",
          cyan: "#22D3EE",
          lime: "#A3E635",
        },
      },
      fontFamily: {
        kid: ['"Noto Sans TC"', '"Comic Neue"', "system-ui", "sans-serif"],
        admin: ['"Inter"', '"Noto Sans TC"', "system-ui", "sans-serif"],
      },
      fontSize: {
        "kid-sm": ["1.125rem", { lineHeight: "1.75rem" }],
        "kid-base": ["1.25rem", { lineHeight: "2rem" }],
        "kid-lg": ["1.5rem", { lineHeight: "2.25rem" }],
        "kid-xl": ["1.875rem", { lineHeight: "2.5rem" }],
        "kid-2xl": ["2.25rem", { lineHeight: "3rem" }],
      },
      borderRadius: {
        kid: "1rem",
        "kid-lg": "1.5rem",
      },
      animation: {
        "bounce-slow": "bounce 2s infinite",
        wiggle: "wiggle 1s ease-in-out infinite",
        "pulse-recording": "pulse-recording 1.5s ease-in-out infinite",
        "star-pop": "star-pop 0.5s ease-out",
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "pulse-recording": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.1)", opacity: "0.8" },
        },
        "star-pop": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "50%": { transform: "scale(1.3)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
