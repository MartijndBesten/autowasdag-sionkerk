import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReservationEmail, sendReservationConfirmation } from "@/lib/email";
import { PACKAGE_SLOTS } from "@/lib/timeslots";
import type { PackageType } from "@/lib/supabase/types";

const VALID_PACKAGES: PackageType[] = ["buiten_wassen", "compleet"];
const PACKAGE_PRICES: Record<string, number> = { buiten_wassen: 7.50, compleet: 12.50 };

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

export async function POST(req: NextRequest) {
  try {
    console.log("[reserveren] start");
    const body = await req.json();
    const {
      full_name, phone, email, license_plate,
      package_type, reservation_date, reservation_time,
      extra_donation, notes,
    } = body;

    if (!full_name || !email || !package_type || !reservation_date || !reservation_time) {
      return NextResponse.json({ error: "Verplichte velden ontbreken." }, { status: 400 });
    }
    if (!VALID_PACKAGES.includes(package_type)) {
      return NextResponse.json({ error: "Ongeldig pakket." }, { status: 400 });
    }

    console.log("[reserveren] validatie ok, supabase aanmaken");
    const supabase = createAdminClient() as any;

    // ── Open/gesloten check (defensief: bij fout behandelen als open) ────────────
    let reservationsOpen = true;
    try {
      console.log("[reserveren] open/gesloten check");
      const { data: eventRow, error: eventErr } = await supabase
        .from("settings").select("value").eq("key", "event").single();
      if (eventErr) {
        console.warn("[reserveren] settings ophalen mislukt:", eventErr.message);
      } else {
        const ev = (eventRow?.value as Record<string, unknown>) ?? {};
        if (ev.reservations_open === false) reservationsOpen = false;
        console.log("[reserveren] reservations_open =", ev.reservations_open);
      }
    } catch (e) {
      console.warn("[reserveren] open/gesloten check crashed:", e);
    }

    if (!reservationsOpen) {
      return NextResponse.json(
        { error: "Reserveren is op dit moment gesloten. Neem contact op met de organisatie als u nog een vraag heeft." },
        { status: 403 }
      );
    }

    // ── Slotbeschikbaarheid ────────────────────────────────────────────────────
    console.log("[reserveren] slot-check ophalen");
    const { data: settingRow } = await supabase
      .from("settings").select("value").eq("key", "event").single();
    const washBays    = ((settingRow?.value as Record<string, unknown>)?.wash_bays as number) ?? 2;
    const slotsNeeded = PACKAGE_SLOTS[package_type as PackageType];

    const { count: occ1 } = await supabase
      .from("car_reservations")
      .select("id", { count: "exact", head: true })
      .eq("reservation_date", reservation_date)
      .eq("reservation_time", reservation_time)
      .neq("status", "cancelled");

    if ((occ1 ?? 0) >= washBays) {
      return NextResponse.json({ error: "Dit tijdslot is helaas niet meer beschikbaar." }, { status: 409 });
    }

    if (slotsNeeded > 1) {
      const nextTime = addMinutes(reservation_time, 20);
      const { count: occ2 } = await supabase
        .from("car_reservations")
        .select("id", { count: "exact", head: true })
        .eq("reservation_date", reservation_date)
        .eq("reservation_time", nextTime)
        .neq("status", "cancelled");

      if ((occ2 ?? 0) >= washBays) {
        return NextResponse.json({ error: "Dit tijdslot is helaas niet meer beschikbaar." }, { status: 409 });
      }
    }

    console.log("[reserveren] insert reservering");
    const price         = PACKAGE_PRICES[package_type] ?? 0;
    const extraDonation = Number(extra_donation) || 0;

    const { data: reservation, error: dbErr } = await supabase
      .from("car_reservations")
      .insert({
        full_name,
        phone:             phone || null,
        email,
        license_plate:     license_plate || null,
        package_type:      package_type as PackageType,
        package_duration:  slotsNeeded * 20,
        reservation_date,
        reservation_time,
        extra_donation:    extraDonation,
        notes:             notes || null,
        slot_count:        1,
        status:            "confirmed",
        payment_status:    "unpaid",
        confirmation_sent: false,
      })
      .select("id, cancellation_token")
      .single();

    if (dbErr) {
      console.error("[reserveren] DB insert fout:", dbErr);
      throw dbErr;
    }

    console.log("[reserveren] insert gelukt, mails versturen");

    sendReservationEmail({
      name: full_name, email, phone: phone || null,
      package: package_type,
      date: reservation_date, time: reservation_time,
      price, extra_donation: extraDonation,
      notes: notes || null,
    }).catch(e => console.error("[reserveren] admin mail fout:", e));

    sendReservationConfirmation({
      name: full_name, email,
      package: package_type,
      date: reservation_date, time: reservation_time,
      price, extra_donation: extraDonation,
    }).catch(e => console.error("[reserveren] bevestigingsmail fout:", e));

    supabase.from("email_logs").insert({
      to_address:     process.env.NOTIFY_EMAIL ?? "",
      subject:        `Nieuwe reservering — ${full_name}`,
      template:       "reservation_admin",
      reference_id:   reservation?.id,
      reference_type: "car_reservation",
      status:         "sent",
    }).catch(() => {});

    supabase.from("audit_logs").insert({
      action:     "INSERT",
      table_name: "car_reservations",
      record_id:  reservation?.id,
      new_data:   { full_name, email, package_type, reservation_date, reservation_time },
    }).catch(() => {});

    console.log("[reserveren] succes");
    return NextResponse.json({ ok: true, id: reservation?.id });
  } catch (err) {
    console.error("[api/reserveren] FOUT:", err);
    return NextResponse.json({ error: "Interne fout bij verwerking." }, { status: 500 });
  }
}
