import { LandingHeader } from "@/components/landing/header";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { RoleCardsSection } from "@/components/landing/role-card";
import { DocsSection } from "@/components/landing/docs-section";
import { Footer } from "@/components/landing/footer";
import { CursorSpotlight } from "@/components/landing/cursor-spotlight";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <CursorSpotlight />
      <LandingHeader />
      <HeroSection />
      <FeaturesSection />
      <RoleCardsSection />
      <DocsSection />
      <Footer />
    </main>
  );
}
