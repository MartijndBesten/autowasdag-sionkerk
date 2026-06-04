import { createAdminClient } from "@/lib/supabase/admin";
import type { Action } from "@/lib/supabase/types";

// ── Actieve actie ophalen ─────────────────────────────────────────────────────

export async function getActiveAction(): Promise<Action | null> {
  try {
    const supabase = createAdminClient() as any;
    const { data } = await supabase
      .from("actions")
      .select("*")
      .eq("is_active", true)
      .eq("is_archived", false)
      .single();
    return (data as Action) ?? null;
  } catch {
    return null;
  }
}

// Backward-compat: leest datum uit actieve actie, valt terug op settings tabel
export async function getEventDate(): Promise<string> {
  const action = await getActiveAction();
  if (action?.event_date) return action.event_date;
  try {
    const supabase = createAdminClient() as any;
    const { data } = await supabase
      .from("settings").select("value").eq("key", "event").single();
    return ((data?.value as Record<string, unknown>)?.date as string) ?? "";
  } catch {
    return "";
  }
}

// ── Datum-hulpfuncties ────────────────────────────────────────────────────────

export function formatEventDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const s = date.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatEventDateShort(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const s = date.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function getEventDay(dateStr: string): string {
  if (!dateStr) return "";
  return String(parseInt(dateStr.split("-")[2] ?? "0", 10));
}

export function getEventMonthName(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("nl-NL", { month: "long" });
}
