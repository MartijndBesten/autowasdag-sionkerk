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
  let volunteersOpen = true;
  try {
    const supabase = createAdminClient() as any;
    const [supRes, eventRes] = await Promise.all([
      supabase.from("settings").select("value").eq("key", "volunteer_supplies").single(),
      supabase.from("settings").select("value").eq("key", "event").single(),
    ]);
    if (Array.isArray(supRes.data?.value) && supRes.data.value.length > 0) {
      suppliesOptions = supRes.data.value as SupplyOption[];
    }
    if ((eventRes.data?.value as Record<string, unknown>)?.volunteers_open === false) {
      volunteersOpen = false;
    }
  } catch { /* val terug op defaults */ }

  return (
    <main
      className="min-h-screen"
      style={{ background: "linear-gradient(170deg, #faf6e8 0%, #f5edd6 50%, #e8f5ef 100%)" }}
    >
      <Navigation />
      {volunteersOpen ? (
        <HelpMeeClient dateFormatted={dateFormatted} suppliesOptions={suppliesOptions} />
      ) : (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-sm space-y-4">
            <div className="text-5xl mb-2">🔒</div>
            <h1 className="text-2xl font-bold text-green-950">Aanmelden is gesloten</h1>
            <p className="text-gray-500 leading-relaxed">
              Aanmelden als vrijwilliger is op dit moment gesloten.
              Neem contact op met de organisatie als je nog een vraag hebt.
            </p>
          </div>
        </div>
      )}
      <ModalRoot />
    </main>
  );
}
