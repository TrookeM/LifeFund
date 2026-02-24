// --- src/app/layout.tsx ---

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FloatingAIChat from "./dashboard/FloatingAIChat";
import { ToastContainer } from "./dashboard/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LifeFund - Salud Financiera",
  description: "IA para la gestión de tus metas financieras",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#050505] text-white overflow-x-hidden relative min-h-screen`}>
        {/* 🌌 Mesh Gradients (Efecto cristal y luces de fondo) */}
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/10 blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/10 blur-[120px] mix-blend-screen" />
          <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[60vw] h-[20vw] rounded-full bg-purple-500/5 blur-[150px] mix-blend-screen" />
        </div>

        {children}
        <FloatingAIChat />
        <ToastContainer />
      </body>
    </html>
  );
}