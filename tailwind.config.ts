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
        neon: {
          cyan:   "#00F5FF",
          purple: "#BD00FF",
          green:  "#00FF88",
          yellow: "#FFB700",
          red:    "#FF2D78",
          blue:   "#0066FF",
        },
        brand: {
          bg:      "#050A0E",
          card:    "#0A1628",
          surface: "#0D1F33",
          border:  "#1A3A4A",
          accent:  "#00F5FF",
          yellow:  "#FFB700",
          red:     "#FF2D78",
          green:   "#00FF88",
        },
      },
      boxShadow: {
        "neon-cyan":   "0 0 8px #00F5FF, 0 0 20px rgba(0,245,255,0.3)",
        "neon-purple": "0 0 8px #BD00FF, 0 0 20px rgba(189,0,255,0.3)",
        "neon-green":  "0 0 8px #00FF88, 0 0 20px rgba(0,255,136,0.3)",
        "neon-red":    "0 0 8px #FF2D78, 0 0 20px rgba(255,45,120,0.3)",
        "card":        "0 0 0 1px rgba(0,245,255,0.08), 0 4px 24px rgba(0,0,0,0.6)",
        "card-hover":  "0 0 0 1px rgba(0,245,255,0.2), 0 8px 32px rgba(0,245,255,0.08)",
      },
      backgroundImage: {
        "grid-dark":
          "linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)",
        "gradient-radial-cyan":
          "radial-gradient(ellipse at top left, rgba(0,245,255,0.08) 0%, transparent 60%)",
        "gradient-radial-purple":
          "radial-gradient(ellipse at bottom right, rgba(189,0,255,0.06) 0%, transparent 60%)",
      },
      backgroundSize: {
        "grid": "40px 40px",
      },
      animation: {
        "pulse-neon": "pulse-neon 2s cubic-bezier(0.4,0,0.6,1) infinite",
        "glow-scan":  "glow-scan 4s linear infinite",
        "border-glow": "border-glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        "pulse-neon": {
          "0%,100%": { opacity: "1", boxShadow: "0 0 8px #00F5FF" },
          "50%":     { opacity: "0.7", boxShadow: "0 0 20px #00F5FF, 0 0 40px rgba(0,245,255,0.4)" },
        },
        "glow-scan": {
          "0%":   { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "0% 100%" },
        },
        "border-glow": {
          "0%":   { borderColor: "rgba(0,245,255,0.2)" },
          "100%": { borderColor: "rgba(0,245,255,0.6)" },
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
