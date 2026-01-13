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
  title: "CredoCarbon | Carbon Credit Management Platform",
  description: "A unified platform for carbon credit registration, validation, issuance, and trading across all global registries. Built for developers and buyers.",
  keywords: ["carbon credits", "carbon offset", "VCS", "Gold Standard", "carbon registry", "ESG", "sustainability"],
  authors: [{ name: "CredoCarbon" }],
  openGraph: {
    title: "CredoCarbon | Carbon Credit Management Platform",
    description: "A unified platform for carbon credit registration, validation, issuance, and trading.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
