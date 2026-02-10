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
  title: "Third Time Traders — A Fantasy Trading Game",
  description:
    "Negotiate. Trade. Survive. Build your empire across a fractured world where every deal could be your last — or your making.",
  keywords: [
    "trading game",
    "strategy",
    "fantasy",
    "browser game",
    "third time traders",
  ],
  openGraph: {
    title: "Third Time Traders",
    description: "A fantasy trading strategy game",
    siteName: "Third Time Traders",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
