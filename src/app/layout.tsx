import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Padel Sartori Control",
  description: "Sistema de gestión integral para academias de pádel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      {/* 
          bg-slate-950: Unifica el color de fondo para todas las pantallas.
          text-slate-50: Asegura legibilidad por defecto.
          selection:bg-[#bdfd2c]: Un toque de estilo para cuando selecciones texto.
      */}
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-50 selection:bg-[#bdfd2c] selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}