import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" });

export const metadata: Metadata = {
  title: "Gestión comercial",
  description: "Sistema de ventas, stock y cuentas corrientes.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR" className={archivo.variable}>
      <body className="bg-background font-sans text-sm text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
