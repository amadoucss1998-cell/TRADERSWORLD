import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { TradesProvider } from "@/context/TradesContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "TradesWorld - Pro Trading Journal",
  description: "The ultimate trading journal and performance analytics platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#0f0f0f] text-white min-h-screen">
        <TradesProvider>
          <Sidebar />
          <main className="ml-64 min-h-screen flex flex-col">
            {children}
          </main>
        </TradesProvider>
      </body>
    </html>
  );
}
