import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0f1117",
          card: "#1a1d27",
          accent: "#2E86AB",
          yellow: "#F39C12",
          red: "#E74C3C",
          green: "#1E8449",
        },
      },
    },
  },
  plugins: [],
};
export default config;
