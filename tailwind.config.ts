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
        green: {
          50:  "#f0faf4",
          100: "#dcf4e6",
          200: "#bbe9cf",
          300: "#86d6ae",
          400: "#4dbc88",
          500: "#28a169",
          600: "#1a8254",
          700: "#166644",
          800: "#155237",
          900: "#12432e",
          950: "#09261a",
        },
        cream: {
          50:  "#fffef9",
          100: "#fefbee",
          200: "#faf5d8",
          300: "#f5ecbb",
        },
        sand: {
          100: "#fdf6e8",
          200: "#f8edcc",
          300: "#f0e0a8",
        },
        gold: {
          100: "#fef3d4",
          200: "#fde4a0",
          300: "#f9cb5e",
          400: "#f0b429",
        },
      },
      fontFamily: {
        jakarta: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        sans:    ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
