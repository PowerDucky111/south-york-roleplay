import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        discord: {
          blurple: "#3B82F6",
          dark: "#101a2b",
          darker: "#0b1220",
          panel: "#111d30",
          hover: "#1a2a40",
          text: "#e2e8f0",
          muted: "#94a3b8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
