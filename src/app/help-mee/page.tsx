import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import HelpMeeClient from "./HelpMeeClient";
import ModalRoot from "@/components/ModalRoot";
import { getEventDate, formatEventDate } from "@/lib/event";

export const metadata: Metadata = {
  title: "Help mee — Autowasdag Sionkerk Houten",
  description:
    "Doe je mee? Help als vrijwilliger, bak iets lekkers, neem spullen mee of word sponsor. Samen maken we de Autowasdag mogelijk.",
};

export default async function HelpMeePage() {
  const eventDate     = await getEventDate();
  const dateFormatted = formatEventDate(eventDate);

  return (
    <main
      className="min-h-screen"
      style={{ background: "linear-gradient(170deg, #faf6e8 0%, #f5edd6 50%, #e8f5ef 100%)" }}
    >
      <Navigation />
      <HelpMeeClient dateFormatted={dateFormatted} />
      <ModalRoot />
    </main>
  );
}
