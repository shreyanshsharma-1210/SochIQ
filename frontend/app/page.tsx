import FloatingNavbar from "@/components/landing/FloatingNavbar";
import HeroSection from "@/components/landing/HeroSection";
import DashboardPreview from "@/components/landing/DashboardPreview";
import TrustStrip from "@/components/landing/TrustStrip";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorks from "@/components/landing/HowItWorks";
import PrivacySection from "@/components/landing/PrivacySection";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-yellow selection:text-charcoal">
      <FloatingNavbar />
      <main className="flex-1">
        <HeroSection />
        <DashboardPreview />
        <TrustStrip />
        <FeaturesSection />
        <HowItWorks />
        <PrivacySection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
