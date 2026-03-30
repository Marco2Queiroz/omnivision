import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#051522",
        surface: "#051522",
        "surface-dim": "#051522",
        "surface-container-lowest": "#010f1c",
        "surface-container-low": "#0d1d2a",
        "surface-container": "#11212f",
        "surface-container-high": "#1c2b39",
        "surface-container-highest": "#273645",
        "surface-bright": "#2c3b49",
        "surface-variant": "#273645",
        foreground: "#d4e4f7",
        "on-surface": "#d4e4f7",
        "on-surface-variant": "#b9cacb",
        "on-background": "#d4e4f7",
        primary: "#e1fdff",
        "primary-container": "#00f2ff",
        "on-primary-container": "#006a71",
        secondary: "#d0bcff",
        "secondary-container": "#571bc1",
        "on-secondary-container": "#c4abff",
        tertiary: "#e7fbff",
        "tertiary-container": "#76ebff",
        outline: "#849495",
        "outline-variant": "#3a494b",
        error: "#ffb4ab",
        "error-container": "#93000a",
      },
      fontFamily: {
        headline: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
      },
      boxShadow: {
        glow: "0 0 32px rgba(0, 242, 255, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
