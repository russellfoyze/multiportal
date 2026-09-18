import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        portal: {
          bg: "#0b0f19",
          sidebar: "#0d1322",
          card: "#111827",
          cardHover: "#161f32",
          border: "#1e293b",
          borderLight: "#283548",
          primary: "#6366f1",
          primaryHover: "#4f46e5",
          accent: "#8b5cf6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
