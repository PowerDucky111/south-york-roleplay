import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        discord: {
          blurple: "#5865F2",
          dark: "#1e1f22",
          darker: "#111214",
          panel: "#2b2d31",
          hover: "#35373c",
          text: "#dbdee1",
          muted: "#949ba4",
        },
      },
    },
  },
  plugins: [],
};

export default config;
