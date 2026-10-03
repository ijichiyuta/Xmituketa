import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "時給ハイエナ計算機",
  description:
    "兼業ハイエナ向け。残り時間から「時給期待値」を計算し、打つ/様子見/やめを判断する学習・期待値管理用ツール。結果は保証しません。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0f14",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
