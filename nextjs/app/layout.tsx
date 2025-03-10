import "./globals.css";
import type { Metadata } from "next";
import React from "react";
import ThemeProvider from './components/ThemeProvider';

export const metadata: Metadata = {
  title: "实验室GPU使用情况",
  description: "GPU Utilization in CITE Lab",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
