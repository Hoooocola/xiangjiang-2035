import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "将来的江来 · 湘江 2035",
  description: "面向地点研究、田野证据与设计方案的研究平台",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
