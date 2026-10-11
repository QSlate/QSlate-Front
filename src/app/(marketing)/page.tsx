import { LandingHero } from '@/widgets/landing-hero/LandingHero';
import { ModularDeskSection } from '@/widgets/modular-desk/ModularDeskSection';
import { PersonasBentoSection } from '@/widgets/personas-bento/PersonasBentoSection';
import { TechMetricsBanner } from '@/widgets/tech-metrics-banner/TechMetricsBanner';

export default function MarketingPage() {
  return (
    <>
      <LandingHero />
      <TechMetricsBanner />
      <ModularDeskSection />
      <PersonasBentoSection />
    </>
  );
}
