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
        bo: {
          navy:     "#050b18",
          surface:  "#0c1628",
          card:     "#111f38",
          border:   "#1e3354",
          muted:    "#2a4060",
          orange:   "#f97316",
          "orange-hover": "#ea6c0a",
          teal:     "#0ea5e9",
          success:  "#22c55e",
          warning:  "#eab308",
          danger:   "#ef4444",
          text:     "#f1f5f9",
          subtle:   "#94a3b8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "bo-gradient": "linear-gradient(135deg, #050b18 0%, #0c1e3a 100%)",
        "card-gradient": "linear-gradient(135deg, #111f38 0%, #0c1628 100%)",
        "orange-gradient": "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
