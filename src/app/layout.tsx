import type { Metadata } from "next";
import { Encode_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const encodeSans = Encode_Sans({
  variable: "--font-encode-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zweitsprache",
  description: "Zweitsprache – Angebote & Kurse",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${encodeSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
