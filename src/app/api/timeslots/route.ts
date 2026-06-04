import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSlots, filterSlotsForPackage } from "@/lib/timeslots";
import type { PackageType } from "@/lib/supabase/types";
import type { AvailableSlot } from "@/lib/timeslots";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const date = searchParams.get("date");
  const pkg  = searchParams.get("package") as PackageType | null;

  if (!date || !pkg) {
    return NextResponse.json({ error: "date en package zijn verplicht." }, { status: 400 });
  }

  try {
    const supabase = createAdminClient() as any;

    const { data: settingRow } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "event")
      .single();

    const settings  = (settingRow?.value as Record<string, unknown>) ?? {};
    const washBays  = (settings.wash_bays  as number) ?? 2;
    const startTime = (settings.start_time as string) ?? "09:00";
    const endTime   = (settings.end_time   as string) ?? "16:00";

    const allSlots = generateSlots(startTime, endTime, 20);

    // Tel bezette slots rechtstreeks op status (niet via sum(slot_count)).
    // confirmed, pending en completed tellen als bezet; cancelled niet.
    const { data: bookings } = await supabase
      .from("car_reservations")
      .select("reservation_time, package_type")
      .eq("reservation_date", date)
      .neq("status", "cancelled");

    // countMap: slot → aantal auto's dat op dat tijdstip begint
    // compleetMap: slot → aantal compleet-auto's dat op dat tijdstip begint (voor spillover)
    const countMap   = new Map<string, number>();
    const compleetMap = new Map<string, number>();

    for (const b of (bookings ?? []) as { reservation_time: string; package_type: string }[]) {
      const t = b.reservation_time.slice(0, 5);
      countMap.set(t, (countMap.get(t) ?? 0) + 1);
      if (b.package_type === "compleet") {
        compleetMap.set(t, (compleetMap.get(t) ?? 0) + 1);
      }
    }

    // Effectieve bezetting per slot = starts op dit slot
    //   + overloop van compleet-auto's die op het vorige slot begonnen
    const slots: AvailableSlot[] = allSlots.map((time, idx) => {
      const own      = countMap.get(time) ?? 0;
      const prevTime = idx > 0 ? allSlots[idx - 1] : null;
      const spillover = prevTime ? (compleetMap.get(prevTime) ?? 0) : 0;
      const effective = own + spillover;
      const avail     = Math.max(0, washBays - effective);
      return {
        time,
        label:         `${time} uur`,
        available:     avail > 0,
        availableBays: avail,
      };
    });

    const filtered = filterSlotsForPackage(slots, pkg, washBays);
    return NextResponse.json({ slots: filtered });
  } catch (err) {
    console.error("[api/timeslots]", err);
    return NextResponse.json({ error: "Interne fout." }, { status: 500 });
  }
}
