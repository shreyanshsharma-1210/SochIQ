import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import WarmupBanner from "@/components/layout/WarmupBanner";

export const metadata: Metadata = {
  title: "DataLens | Cloud Data Analytics & Developer API",
  description: "Upload your data. Understand it. Discover what matters with memory-only privacy and instant cloud intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&family=Playfair+Display:ital,wght@0,600..800;1,600..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-text min-h-screen flex flex-col font-sans">
        <WarmupBanner />
        <Header />
        <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}
