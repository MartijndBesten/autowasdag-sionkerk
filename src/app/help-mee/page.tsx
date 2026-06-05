import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import HelpMeeClient from "./HelpMeeClient";
import ModalRoot from "@/components/ModalRoot";
import { getEventDate, formatEventDate } from "@/lib/event";
import { createAdminClient } from "@/lib/supabase/admin";

export type SupplyOption = { value: string; label: string };

const DEFAULT_SUPPLIES: SupplyOption[] = [
  { value: "emmer",             label: "Emmer" },
  { value: "autowasshampoo",    label: "Autowasshampoo" },
  { value: "wasborstel",        label: "Wasborstel" },
  { value: "haspel",            label: "Haspel / verlengsnoer" },
  { value: "zeem",              label: "Zeem" },
  { value: "doeken_binnenkant", label: "Doeken voor binnenkant auto" },
  { value: "stofzuiger",        label: "Stofzuiger" },
  { value: "spons",             label: "Spons" },
  { value: "droogdoeken",       label: "Droogdoeken" },
  { value: "tuinslang",         label: "Tuinslang" },
  { value: "hogedrukreiniger",  label: "Hogedrukreiniger" },
  { value: "partytent",         label: "Partytent" },
  { value: "tafel",             label: "Tafel" },
  { value: "anders",            label: "Anders, namelijk" },
];

export const metadata: Metadata = {
  title: "Help mee — Autowasdag Sionkerk Houten",
  description:
    "Doe je mee? Help als vrijwilliger, bak iets lekkers, neem spullen mee of word sponsor. Samen maken we de Autowasdag mogelijk.",
};

export default async function HelpMeePage() {
  const eventDate     = await getEventDate();
  const dateFormatted = formatEventDate(eventDate);

  let suppliesOptions: SupplyOption[] = DEFAULT_SUPPLIES;
  try {
    const supabase = createAdminClient() as any;
    const { data: supData } = await supabase
      .from("settings").select("value").eq("key", "volunteer_supplies").single();
    if (Array.isArray(supData?.value) && supData.value.length > 0) {
      suppliesOptions = supData.value as SupplyOption[];
    }
  } catch {
    // val terug op defaults bij build of ontbrekende env vars
  }

  return (
    <main
      className="min-h-screen"
      style={{ background: "linear-gradient(170deg, #faf6e8 0%, #f5edd6 50%, #e8f5ef 100%)" }}
    >
      <Navigation />
      <HelpMeeClient dateFormatted={dateFormatted} suppliesOptions={suppliesOptions} />
      <ModalRoot />
    </main>
  );
}
