import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "BO Command Center",
  description: "Boat Outfitters Marketing Project Management",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bo-navy flex">
        <Sidebar />
        <main className="flex-1 min-h-screen overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-6 py-6 lg:px-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
