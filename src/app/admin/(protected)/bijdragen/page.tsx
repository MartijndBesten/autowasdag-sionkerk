import { createClient } from "@/lib/supabase/server";
import type { ContributionSignup } from "@/lib/supabase/types";
import BijdragenClient from "./BijdragenClient";

export default async function BijdragenPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contribution_signups")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as ContributionSignup[];
  return <BijdragenClient initialData={rows} />;
}
