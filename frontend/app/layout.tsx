import type { Metadata } from "next";
import "./globals.css";
import { DatasetSessionProvider } from "@/context/DatasetSessionContext";

export const metadata: Metadata = {
  title: "SochIQ — Think smarter. See deeper.",
  description:
    "An intelligent workspace that turns raw data into meaningful insights and confident decisions. Upload CSV, Excel, or JSON datasets with instant in-memory privacy.",
  icons: {
    icon: "/favicon.ico",
  },
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Sora:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-text min-h-screen flex flex-col font-sans selection:bg-yellow selection:text-charcoal">
        <DatasetSessionProvider>
          {children}
        </DatasetSessionProvider>
      </body>
    </html>
  );
}
