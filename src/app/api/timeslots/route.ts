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

    // Haal event-instellingen op
    const { data: settingRow } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "event")
      .single();

    const settings = (settingRow?.value as Record<string, unknown>) ?? {};
    const washBays  = (settings.wash_bays as number)   ?? 2;
    const startTime = (settings.start_time as string)  ?? "09:00";
    const endTime   = (settings.end_time as string)    ?? "16:00";

    // Alle slots genereren
    const allSlots = generateSlots(startTime, endTime, 20);

    // Bezetting ophalen via DB-functie
    const { data: occupancy } = await supabase
      .rpc("get_available_slots", { p_date: date });

    const occupancyMap = new Map<string, number>(
      (occupancy ?? []).map((r: { slot_time: string; available_bays: number }) => [
        r.slot_time.slice(0, 5),
        r.available_bays,
      ])
    );

    // Slots opbouwen
    const slots: AvailableSlot[] = allSlots.map(time => ({
      time,
      label: `${time} uur`,
      available: (occupancyMap.get(time) ?? washBays) > 0,
      availableBays: occupancyMap.get(time) ?? washBays,
    }));

    const filtered = filterSlotsForPackage(slots, pkg, washBays);

    return NextResponse.json({ slots: filtered });
  } catch (err) {
    console.error("[api/timeslots]", err);
    return NextResponse.json({ error: "Interne fout." }, { status: 500 });
  }
}
