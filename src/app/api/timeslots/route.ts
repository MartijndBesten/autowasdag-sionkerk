import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSlots, filterSlotsForPackage, computeSlotsNeeded, SLOT_DURATION } from "@/lib/timeslots";
import type { PackageType } from "@/lib/supabase/types";
import type { AvailableSlot } from "@/lib/timeslots";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const date       = searchParams.get("date");
  const pkg        = searchParams.get("package") as PackageType | null;
  const excludeId  = searchParams.get("exclude_id") ?? null; // reservering die wordt verplaatst

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
    const washBays  = (settings.wash_bays       as number) ?? 2;
    const startTime = (settings.start_time      as string) ?? "09:00";
    const endTime   = (settings.end_time        as string) ?? "16:00";
    const slotDur   = (settings.slot_duration_minutes as number) ?? SLOT_DURATION;

    // Pakketduur uit instellingen (fallback op standaardwaarden)
    const durBuiten  = (settings.duration_buiten_wassen as number) ?? 20;
    const durCompleet= (settings.duration_compleet      as number) ?? 40;

    const pkgDuration  = pkg === "compleet" ? durCompleet : durBuiten;
    const slotsNeeded  = computeSlotsNeeded(pkgDuration, slotDur);

    const allSlots = generateSlots(startTime, endTime, slotDur);

    // Tel bezette slots — confirmed, pending en completed tellen als bezet
    // Als exclude_id is meegegeven (bij verplaatsen), tel die reservering niet mee
    let bookingQuery = supabase
      .from("car_reservations")
      .select("reservation_time, package_type, package_duration")
      .eq("reservation_date", date)
      .neq("status", "cancelled");
    if (excludeId) bookingQuery = bookingQuery.neq("id", excludeId);
    const { data: bookings } = await bookingQuery;

    // countMap: slot → aantal auto's dat op dat tijdstip begint
    // spillMap: slot → hoeveel tijdblokken extra bezet zijn door multi-slot pakketten
    const countMap = new Map<string, number>();
    const spillMap = new Map<string, number>(); // slots die bezet zijn door vorige starts

    for (const b of (bookings ?? []) as { reservation_time: string; package_duration: number }[]) {
      const t         = b.reservation_time.slice(0, 5);
      const bSlots    = computeSlotsNeeded(b.package_duration || 20, slotDur);
      const startIdx  = allSlots.indexOf(t);
      if (startIdx === -1) continue;
      countMap.set(t, (countMap.get(t) ?? 0) + 1);
      // Extra slots die dit pakket bezet houden (overloop)
      for (let i = 1; i < bSlots; i++) {
        const spillSlot = allSlots[startIdx + i];
        if (spillSlot) spillMap.set(spillSlot, (spillMap.get(spillSlot) ?? 0) + 1);
      }
    }

    const slots: AvailableSlot[] = allSlots.map(time => {
      const ownBookings  = countMap.get(time) ?? 0;
      const spillBookings= spillMap.get(time) ?? 0;
      const effective    = ownBookings + spillBookings;
      const avail        = Math.max(0, washBays - effective);
      return {
        time,
        label:         `${time} uur`,
        available:     avail > 0,
        availableBays: avail,
      };
    });

    const filtered = filterSlotsForPackage(slots, slotsNeeded, washBays);

    // Geef ook pakketduur mee zodat frontend het kan tonen
    return NextResponse.json({
      slots: filtered,
      package_duration: pkgDuration,
      slots_needed:     slotsNeeded,
      wash_bays:        washBays,
      slot_duration:    slotDur,
    });
  } catch (err) {
    console.error("[api/timeslots]", err);
    return NextResponse.json({ error: "Interne fout." }, { status: 500 });
  }
}
