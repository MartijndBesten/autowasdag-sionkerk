import { createClient } from "@/lib/supabase/server";
import type { Action } from "@/lib/supabase/types";
import ActiesClient from "./ActiesClient";

export default async function ActiesPage() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("instellingen")
    .select("value")
    .eq("key", "sitecontent")
    .single();

  const content = (data?.value as Action) ?? null;
  return <ActiesClient initialContent={content} />;
}
