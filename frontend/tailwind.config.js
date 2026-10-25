/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0a0a0f",
          secondary: "#101018",
          tertiary: "#15151f",
          elevated: "#1a1a26",
        },
        accent: {
          blue: "#3b82f6",
          purple: "#8b5cf6",
        },
        status: {
          building: "#f97316",
          "building-dim": "#f9731633",
          reviewing: "#a855f7",
          "reviewing-dim": "#a855f733",
          shipped: "#22c55e",
          "shipped-dim": "#22c55e33",
          failed: "#ef4444",
          "failed-dim": "#ef444433",
        },
        term: {
          green: "#5ff28c",
          dim: "#5c6370",
          border: "#23232f",
        },
      },
      fontFamily: {
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["Inter", "SF Pro Display", "Helvetica Neue", "system-ui", "sans-serif"],
        display: ["Inter", "SF Pro Display", "Helvetica Neue", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(59, 130, 246, 0.35)",
        "glow-purple": "0 0 20px rgba(139, 92, 246, 0.35)",
        "glow-sm": "0 0 8px rgba(59, 130, 246, 0.45)",
        terminal: "0 0 0 1px rgba(59,130,246,0.15), 0 20px 60px -20px rgba(0,0,0,0.8)",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        blinkCursor: {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "92%": { opacity: "1" },
          "93%": { opacity: "0.94" },
          "94%": { opacity: "1" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        scanline: "scanline 8s linear infinite",
        blinkCursor: "blinkCursor 1s step-end infinite",
        flicker: "flicker 6s infinite",
        glowPulse: "glowPulse 2.4s ease-in-out infinite",
        rise: "rise 0.35s ease-out both",
      },
    },
  },
  plugins: [],
};
