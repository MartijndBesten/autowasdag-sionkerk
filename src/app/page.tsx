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
import { getEventDate } from "@/lib/event";

export default async function Home() {
  const eventDate = await getEventDate();

  return (
    <main>
      <Navigation />
      <Hero eventDate={eventDate} />
      <HelpMee />
      <HowItWorks />
      <CommunityDay />
      <Packages />
      <AboutSection />
      <PracticalInfo eventDate={eventDate} />
      <Footer eventDate={eventDate} />
      <ModalRoot />
    </main>
  );
}
