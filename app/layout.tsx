import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "JuriSearch — Buscador de Jurisprudencia Argentina",
  description:
    "Buscá jurisprudencia argentina en CSJN, SAIJ, cámaras de apelaciones y tribunales provinciales. Filtrá por provincia, fuero y materia.",
  keywords: "jurisprudencia argentina, CSJN, fallos, derecho argentino, buscador juridico, tribunal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
