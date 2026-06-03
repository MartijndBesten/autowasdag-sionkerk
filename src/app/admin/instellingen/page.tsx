import { createClient } from "@/lib/supabase/server";
import InstellingenClient from "./InstellingenClient";

export default async function InstellingenPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("*");

  const settings: Record<string, unknown> = {};
  const rows = (data ?? []) as { key: string; value: unknown }[];
  rows.forEach(row => { settings[row.key] = row.value; });

  return <InstellingenClient initialSettings={settings} />;
}
