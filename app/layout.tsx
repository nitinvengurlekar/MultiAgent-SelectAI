import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TCEQ MultiAgent SelectAI Demo",
  description: "TCEQ environmental intelligence and Oracle Deep Data Security demos on Autonomous Database."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
