import type { Metadata } from "next";
import { Encode_Sans, Geist_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const encodeSans = Encode_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geist = Geist({subsets:['latin'],variable:'--font-geist'});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zweitsprache",
  description: "Zweitsprache – Workshops & Kurse",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={cn("h-full", "antialiased", encodeSans.variable, geistMono.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

