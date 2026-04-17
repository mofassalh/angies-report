import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Angie's Reports",
  description: "Business intelligence and reporting dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
