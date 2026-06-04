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
import { getActiveAction } from "@/lib/event";

export default async function Home() {
  const action = await getActiveAction();

  return (
    <main>
      <Navigation />
      <Hero action={action} />
      <HelpMee />
      <HowItWorks action={action} />
      <CommunityDay action={action} />
      <Packages action={action} />
      <AboutSection />
      <PracticalInfo action={action} />
      <Footer action={action} />
      <ModalRoot />
    </main>
  );
}
