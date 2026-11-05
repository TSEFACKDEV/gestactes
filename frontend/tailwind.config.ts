import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F6F3",
        surface: "#FFFFFF",
        "surface-muted": "#F1EFEA",
        ink: "#1F2A28",
        "ink-soft": "#5F6B68",
        line: "#E5E2DB",
        primary: {
          DEFAULT: "#2F6F68",
          hover: "#275E58",
          soft: "#E8F1EF",
        },
        accent: {
          DEFAULT: "#B98A4A",
          soft: "#F6EEE2",
        },
        success: {
          DEFAULT: "#3F7D5A",
          soft: "#EAF3ED",
        },
        warning: {
          DEFAULT: "#B7791F",
          soft: "#FBF1DF",
        },
        danger: {
          DEFAULT: "#B45151",
          soft: "#F9EAEA",
        },
        info: {
          DEFAULT: "#4A6FA5",
          soft: "#EAF0F8",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(31,42,40,.04), 0 8px 24px rgba(31,42,40,.06)",
        lifted: "0 2px 4px rgba(31,42,40,.05), 0 16px 40px rgba(31,42,40,.08)",
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.625rem",
        lg: "0.875rem",
        xl: "1.125rem",
        "2xl": "1.5rem",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-600px 0" },
          "100%": { backgroundPosition: "600px 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".55" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "slide-up": "slide-up 240ms cubic-bezier(.22,1,.36,1)",
        "scale-in": "scale-in 180ms ease-out",
        shimmer: "shimmer 1.4s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [forms, typography],
} satisfies Config;
