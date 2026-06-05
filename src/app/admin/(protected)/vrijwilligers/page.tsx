import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VolunteerSignup } from "@/lib/supabase/types";
import VrijwilligersClient from "./VrijwilligersClient";

const DEFAULT_SUPPLIES = [
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

export default async function VrijwilligersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("volunteer_signups")
    .select("*")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  const admin = createAdminClient() as any;
  const { data: supData } = await admin
    .from("settings").select("value").eq("key", "volunteer_supplies").single();
  const suppliesOptions: { value: string; label: string }[] =
    Array.isArray(supData?.value) && supData.value.length > 0
      ? supData.value
      : DEFAULT_SUPPLIES;

  const rows = (data ?? []) as VolunteerSignup[];

  return <VrijwilligersClient initialRows={rows} suppliesOptions={suppliesOptions} />;
}
