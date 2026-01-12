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
  title: "CyberComply - Framework Mapper & Gap Analysis",
  description: "Open-source cybersecurity control mapping and gap analysis for financial services. Map controls across NYDFS 500, ISO 27001, SOC 2, NIST, PCI DSS and more.",
  keywords: ["cybersecurity", "compliance", "NYDFS", "ISO 27001", "SOC 2", "NIST CSF", "PCI DSS", "gap analysis"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-cyber-bg text-cyber-text min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
