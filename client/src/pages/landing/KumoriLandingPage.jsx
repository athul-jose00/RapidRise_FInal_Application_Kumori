import { useEffect, useRef, useState } from "react";
import {
  useReveal,
} from "../../components/landing/landingUtils.jsx";
import LandingHeader from "../../components/landing/LandingHeader.jsx";
import {
  HeroSection,
  HighlightsSection,
  FeaturesSection,
  WorkflowSection,
  CtaSection,
  LandingFooter,
} from "../../components/landing/LandingSections.jsx";

export default function KumoriLandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const featuresRef = useRef(null);
  const workflowRef = useRef(null);
  const ctaRef = useRef(null);

  useReveal(heroRef);
  useReveal(statsRef);
  useReveal(featuresRef);
  useReveal(workflowRef);
  useReveal(ctaRef);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FFFDFD] text-neutral-800 selection:bg-[#FFB7AC]/40 selection:text-neutral-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-[-15%] h-140 w-140 rounded-full bg-[#FFB7AC]/18 blur-[130px]" />
        <div className="absolute top-80 right-[-12%] h-120 w-120 rounded-full bg-[#C62828]/6 blur-[130px]" />
        <div className="absolute top-220 left-[15%] h-100 w-100 rounded-full bg-[#FFB7AC]/12 blur-[130px]" />
        <div className="noise-layer absolute inset-0 opacity-[0.035]" />
      </div>

      <LandingHeader
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        scrolled={scrolled}
      />

      <main id="top" className="relative z-10">
        <HeroSection sectionRef={heroRef} />
        <HighlightsSection sectionRef={statsRef} />
        <FeaturesSection sectionRef={featuresRef} />
        <WorkflowSection sectionRef={workflowRef} />
        <CtaSection sectionRef={ctaRef} />
      </main>

      <LandingFooter />
    </div>
  );
}
