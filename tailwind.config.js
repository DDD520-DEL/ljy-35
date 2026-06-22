/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
    },
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0B1220",
          secondary: "#0F172A",
          tertiary: "#1E293B",
          elevation: "#1E3A5F33",
        },
        brand: {
          50: "#E0F2FE",
          100: "#BAE6FD",
          200: "#7DD3FC",
          300: "#38BDF8",
          400: "#0EA5E9",
          500: "#0284C7",
          600: "#0369A1",
          700: "#075985",
        },
        accent: {
          teal: "#14B8A6",
          emerald: "#10B981",
          amber: "#F59E0B",
          rose: "#F43F5E",
        },
        line: {
          a: "#0EA5E9",
          b: "#14B8A6",
          c: "#8B5CF6",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(14, 165, 233, 0.35)",
        "glow-teal": "0 0 20px rgba(20, 184, 166, 0.35)",
        "glow-rose": "0 0 20px rgba(244, 63, 94, 0.35)",
        card: "0 4px 24px rgba(0,0,0,0.25)",
      },
      backgroundImage: {
        "radial-fade": "radial-gradient(ellipse at top, rgba(14,165,233,0.12), transparent 60%)",
        "grid-lines":
          "linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in-up": "fadeInUp 0.6s ease-out",
        "slide-in": "slideIn 0.4s ease-out",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
