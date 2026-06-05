import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Tijdelijk cleanup-endpoint — verwijder na gebruik
// POST /api/debug/cleanup?token=CLEANUP2026

export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (token !== "CLEANUP2026") {
    return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  }

  const supabase = createAdminClient() as any;

  // Haal ALLE reserveringen op
  const { data: all } = await supabase
    .from("car_reservations")
    .select("id, full_name, email, license_plate, status, reservation_time, package_type")
    .order("created_at", { ascending: true });

  // Bepaal welke records behouden blijven (Fam Blitterswijk)
  const keepIds = (all ?? [])
    .filter((r: any) =>
      r.full_name?.toLowerCase().includes("blitterswijk") ||
      r.email?.toLowerCase().includes("jannekevanherpe")
    )
    .map((r: any) => r.id);

  // Hard-delete alle anderen
  const toDelete = (all ?? []).filter((r: any) => !keepIds.includes(r.id));
  const deleteIds = toDelete.map((r: any) => r.id);

  let deleted = 0;
  let errors: string[] = [];

  if (deleteIds.length > 0) {
    const { error } = await supabase
      .from("car_reservations")
      .delete()
      .in("id", deleteIds);

    if (error) {
      errors.push(error.message);
    } else {
      deleted = deleteIds.length;
    }
  }

  // Controleer wat er overblijft
  const { data: remaining } = await supabase
    .from("car_reservations")
    .select("id, full_name, email, reservation_time, package_type, status")
    .order("created_at", { ascending: true });

  return NextResponse.json({
    deleted_count: deleted,
    deleted_records: toDelete.map((r: any) => ({
      name: r.full_name, email: r.email, time: r.reservation_time, pkg: r.package_type,
    })),
    kept_count: keepIds.length,
    remaining: remaining,
    errors,
  });
}
