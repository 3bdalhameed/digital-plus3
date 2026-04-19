import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          50:  "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7C3AED",
          800: "#6d28d9",
          900: "#4c1d95",
        },
        purple: {
          50:  "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7C3AED",
          800: "#6d28d9",
          900: "#4c1d95",
        },
        violet: {
          soft: "#EDE9FE",
          muted: "#F5F3FF",
          border: "#ddd6fe",
        },
      },
      fontFamily: {
        cairo: ["Cairo", "sans-serif"],
        tajawal: ["Tajawal", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)",
        "hero-gradient": "linear-gradient(135deg, #6D28D9 0%, #7C3AED 50%, #9333EA 100%)",
        "soft-gradient": "linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 100%)",
      },
      boxShadow: {
        "purple-sm": "0 4px 14px rgba(124,58,237,0.25)",
        "purple-md": "0 8px 32px rgba(124,58,237,0.3)",
        "purple-lg": "0 16px 48px rgba(124,58,237,0.35)",
        card: "0 2px 8px rgba(124,58,237,0.08), 0 0 0 1px rgba(124,58,237,0.06)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
