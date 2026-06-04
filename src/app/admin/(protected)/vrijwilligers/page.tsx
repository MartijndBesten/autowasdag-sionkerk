import { createClient } from "@/lib/supabase/server";
import type { VolunteerSignup } from "@/lib/supabase/types";
import VrijwilligersClient from "./VrijwilligersClient";

export default async function VrijwilligersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("volunteer_signups")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as VolunteerSignup[];

  return <VrijwilligersClient initialRows={rows} />;
}
