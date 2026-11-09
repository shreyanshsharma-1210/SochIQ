import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFDF8",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#9B681E",
          hover: "#845617",
          light: "#FDF8F0",
        },
        gold: {
          DEFAULT: "#C99A3A",
          light: "#FBF3E2",
          dark: "#A37A25",
        },
        saffron: {
          DEFAULT: "#E9A23B",
          light: "#FEF6EA",
        },
        maroon: {
          DEFAULT: "#713B36",
          light: "#FBF0EF",
        },
        text: {
          DEFAULT: "#28251F",
          muted: "#817B70",
          light: "#A39E94",
        },
        border: {
          DEFAULT: "#EEE7D9",
          dark: "#DDD3C0",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
      },
      boxShadow: {
        diwali: "0 4px 20px -2px rgba(201, 154, 58, 0.08)",
        "diwali-glow": "0 0 25px -5px rgba(233, 162, 59, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;

