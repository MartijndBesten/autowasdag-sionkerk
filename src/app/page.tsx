import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import HelpMee from "@/components/HelpMee";
import HowItWorks from "@/components/HowItWorks";
import CommunityDay from "@/components/CommunityDay";
import Packages from "@/components/Packages";
import AboutSection from "@/components/AboutSection";
import PracticalInfo from "@/components/PracticalInfo";
import Footer from "@/components/Footer";
import ModalRoot from "@/components/ModalRoot";

export default function Home() {
  return (
    <main>
      <Navigation />
      <Hero />
      <HelpMee />
      <HowItWorks />
      <CommunityDay />
      <Packages />
      <AboutSection />
      <PracticalInfo />
      <Footer />
      <ModalRoot />
    </main>
  );
}
