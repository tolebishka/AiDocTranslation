/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgb(15 23 42 / 0.06), 0 2px 8px -2px rgb(15 23 42 / 0.04)",
        lift: "0 12px 40px -12px rgb(15 23 42 / 0.12), 0 4px 16px -4px rgb(15 23 42 / 0.06)",
        innerGlow: "inset 0 1px 0 0 rgb(255 255 255 / 0.6)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      backgroundImage: {
        "mesh-header":
          "radial-gradient(ellipse 100% 120% at 50% -40%, rgb(45 212 191 / 0.18), transparent 55%)",
        "mesh-subtle":
          "radial-gradient(ellipse 90% 60% at 100% 0%, rgb(45 212 191 / 0.08), transparent 50%), radial-gradient(ellipse 70% 50% at 0% 100%, rgb(99 102 241 / 0.06), transparent 45%)",
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out forwards",
        shimmer: "shimmer 1.2s ease-in-out infinite",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
