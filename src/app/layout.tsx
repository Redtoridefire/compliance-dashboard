import type { Metadata } from "next";
import "./globals.css";

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
      <body className="font-sans antialiased bg-cyber-bg text-cyber-text min-h-screen">
        {children}
      </body>
    </html>
  );
}
