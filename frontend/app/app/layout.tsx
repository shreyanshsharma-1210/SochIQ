import AppHeader from "@/components/layout/AppHeader";
import AppSidebar from "@/components/layout/AppSidebar";
import WarmupBanner from "@/components/layout/WarmupBanner";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <WarmupBanner />
      <AppHeader />
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        <AppSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

