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
  title: "NOVA-1 | Autonomous Electric Explorer",
  description: "An autonomous electric explorer engineered for terrain, silence, and routes beyond the map.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
    >
      <body className="font-sans min-h-screen bg-black text-white selection:bg-white/20 selection:text-white">
        {children}
      </body>
    </html>
  );
}
