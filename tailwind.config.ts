import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        discord: {
          blurple: "#4f8ff7",
          dark: "#0e1728",
          darker: "#0b1220",
          panel: "#121f33",
          hover: "#1b2d47",
          text: "#e8eef7",
          muted: "#8fa1b8",
        },
        syrp: {
          bg: "#0b1220",
          sidebar: "#0e1728",
          panel: "#121f33",
          raised: "#17263d",
          blue: "#4f8ff7",
          muted: "#8fa1b8",
          border: "#263750",
        },
      },
    },
  },
  plugins: [],
};

export default config;
