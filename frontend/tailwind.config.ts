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
        // SochIQ Primary Palette
        charcoal: {
          DEFAULT: "#111111",
          deep: "#1B1B1B",
          light: "#222222",
        },
        surface: "#FFFFFF",
        background: "#FAFAF8",
        yellow: {
          DEFAULT: "#FFDF00",
          hover: "#E6C900",
          light: "#FFF9D2",
        },
        grey: {
          light: "#EAEAEA",
          border: "#EAEAEA",
          muted: "#777777",
          subtle: "#F5F5F3",
        },
        // Backward-compatible semantic aliases
        text: {
          DEFAULT: "#111111",
          muted: "#777777",
          light: "#999999",
        },
        border: {
          DEFAULT: "#EAEAEA",
          dark: "#D4D4D4",
        },
        primary: {
          DEFAULT: "#111111",
          hover: "#1B1B1B",
          light: "#FAFAF8",
        },
        accent: {
          DEFAULT: "#FFDF00",
          hover: "#F0D000",
        },
      },
      fontFamily: {
        heading: ["var(--font-sora)", "Sora", "sans-serif"],
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
        "card-hover": "0 10px 25px -5px rgba(0,0,0,0.07), 0 8px 10px -6px rgba(0,0,0,0.04)",
        pill: "0 2px 10px rgba(0,0,0,0.06)",
        preview: "0 25px 60px -15px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
        accent: "0 4px 14px 0 rgba(255, 223, 0, 0.4)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};
export default config;
