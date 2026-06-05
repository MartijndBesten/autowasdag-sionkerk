import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient }      from "@/lib/supabase/server";
import { sendReservationConfirmation } from "@/lib/email";
import { computeSlotsNeeded, generateSlots, SLOT_DURATION } from "@/lib/timeslots";
import type { PackageType } from "@/lib/supabase/types";

function addMins(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total  = h * 60 + m + minutes;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

// ── PATCH: verplaats reservering naar nieuw tijdslot ─────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auth check
    const session = await createClient();
    const { data: { user } } = await session.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const body = await req.json();
    const { new_time } = body;
    if (!new_time) return NextResponse.json({ error: "new_time is verplicht." }, { status: 400 });

    const supabase = createAdminClient() as any;

    // Huidige reservering ophalen
    const { data: res, error: fetchErr } = await supabase
      .from("car_reservations")
      .select("id, reservation_date, reservation_time, package_type, package_duration, status")
      .eq("id", id)
      .single();

    if (fetchErr || !res) {
      return NextResponse.json({ error: "Reservering niet gevonden." }, { status: 404 });
    }
    if (res.status === "cancelled") {
      return NextResponse.json({ error: "Geannuleerde reserveringen kunnen niet worden verplaatst." }, { status: 409 });
    }

    // Event-instellingen ophalen voor capaciteitscheck
    const { data: eventRow } = await supabase
      .from("settings").select("value").eq("key", "event").single();
    const ev         = (eventRow?.value as Record<string, unknown>) ?? {};
    const washBays   = (ev.wash_bays as number) ?? 2;
    const slotDur    = (ev.slot_duration_minutes as number) ?? SLOT_DURATION;
    const durBuiten  = (ev.duration_buiten_wassen as number) ?? 20;
    const durCompleet= (ev.duration_compleet as number) ?? 40;
    const startTime  = (ev.start_time as string) ?? "09:00";
    const endTime    = (ev.end_time   as string) ?? "16:00";

    const pkgDur     = res.package_type === "compleet" ? durCompleet : durBuiten;
    const slotsNeeded = computeSlotsNeeded(pkgDur, slotDur);
    const allSlots   = generateSlots(startTime, endTime, slotDur);

    // Bestaande boekingen op dezelfde dag ophalen, deze reservering uitgesloten
    const { data: bookings } = await supabase
      .from("car_reservations")
      .select("reservation_time, package_duration")
      .eq("reservation_date", res.reservation_date)
      .neq("status", "cancelled")
      .neq("id", id);

    // Bouw bezettingskaart
    const countMap = new Map<string, number>();
    const spillMap = new Map<string, number>();
    for (const b of (bookings ?? []) as { reservation_time: string; package_duration: number }[]) {
      const t = b.reservation_time.slice(0, 5);
      const n = computeSlotsNeeded(b.package_duration || 20, slotDur);
      const si = allSlots.indexOf(t);
      if (si === -1) continue;
      countMap.set(t, (countMap.get(t) ?? 0) + 1);
      for (let i = 1; i < n; i++) {
        const ss = allSlots[si + i];
        if (ss) spillMap.set(ss, (spillMap.get(ss) ?? 0) + 1);
      }
    }

    // Capaciteitscheck voor alle benodigde slots
    for (let i = 0; i < slotsNeeded; i++) {
      const checkTime  = i === 0 ? new_time : addMins(new_time, i * slotDur);
      const own        = countMap.get(checkTime) ?? 0;
      const spill      = spillMap.get(checkTime) ?? 0;
      if (own + spill >= washBays) {
        return NextResponse.json(
          { error: `Tijdslot ${checkTime} is niet meer beschikbaar.` },
          { status: 409 }
        );
      }
    }

    // Update uitvoeren
    const { error: updateErr } = await supabase
      .from("car_reservations")
      .update({ reservation_time: new_time, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true, new_time });
  } catch (err) {
    console.error("[api/reserveren/[id] PATCH]", err);
    return NextResponse.json({ error: "Verplaatsen mislukt." }, { status: 500 });
  }
}

// ── POST: stuur nieuwe bevestigingsmail naar klant ───────────────────────────
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auth check
    const session = await createClient();
    const { data: { user } } = await session.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const supabase = createAdminClient() as any;

    const { data: res, error: fetchErr } = await supabase
      .from("car_reservations")
      .select("full_name, email, package_type, reservation_date, reservation_time, package_duration, extra_donation")
      .eq("id", id)
      .single();

    if (fetchErr || !res) {
      return NextResponse.json({ error: "Reservering niet gevonden." }, { status: 404 });
    }

    // Event-instellingen voor prijs
    const { data: priceRow } = await supabase
      .from("settings").select("value").eq("key", "prices").single();
    const prices = (priceRow?.value as Record<string, number>) ?? {};
    const price  = prices[res.package_type] ?? (res.package_type === "compleet" ? 12.50 : 7.50);

    await sendReservationConfirmation({
      name:          res.full_name,
      email:         res.email,
      package:       res.package_type,
      date:          res.reservation_date,
      time:          String(res.reservation_time).slice(0, 5),
      duration_min:  res.package_duration ?? (res.package_type === "compleet" ? 40 : 20),
      price,
      extra_donation: res.extra_donation ?? 0,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/reserveren/[id] POST]", err);
    return NextResponse.json({ error: "E-mail versturen mislukt." }, { status: 500 });
  }
}
