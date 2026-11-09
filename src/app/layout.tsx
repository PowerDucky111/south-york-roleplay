import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "South York Roleplay — Community Portal",
  description: "Applications, support and community services for South York Roleplay",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}