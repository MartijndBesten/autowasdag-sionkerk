import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReservationEmail, sendReservationConfirmation } from "@/lib/email";
import { computeSlotsNeeded, SLOT_DURATION } from "@/lib/timeslots";
import type { PackageType } from "@/lib/supabase/types";

const VALID_PACKAGES: PackageType[] = ["buiten_wassen", "compleet"];
const PACKAGE_PRICES: Record<string, number> = { buiten_wassen: 10.00, compleet: 15.00 };

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      full_name, phone, email, license_plate,
      package_type, reservation_date, reservation_time,
      extra_donation, notes,
    } = body;

    // ── Validatie ─────────────────────────────────────────────────────────────
    if (!full_name || !email || !package_type || !reservation_date || !reservation_time) {
      return NextResponse.json({ error: "Verplichte velden ontbreken." }, { status: 400 });
    }
    if (!VALID_PACKAGES.includes(package_type)) {
      return NextResponse.json({ error: "Ongeldig pakket." }, { status: 400 });
    }

    const supabase = createAdminClient() as any;

    // ── Open/gesloten check ────────────────────────────────────────────────────
    const { data: eventRow, error: eventErr } = await supabase
      .from("settings").select("value").eq("key", "event").single();

    if (eventErr) {
      console.error("[reserveren] settings niet leesbaar:", eventErr.message);
      return NextResponse.json(
        { error: "Reserveren is tijdelijk niet beschikbaar. Probeer het over enkele minuten opnieuw." },
        { status: 503 }
      );
    }

    const ev = (eventRow?.value as Record<string, unknown>) ?? {};
    if (ev.reservations_open === false) {
      return NextResponse.json(
        { error: "Reserveren is op dit moment gesloten. Neem contact op met de organisatie als u nog een vraag heeft." },
        { status: 403 }
      );
    }

    // ── Slotbeschikbaarheid ────────────────────────────────────────────────────
    const washBays    = (ev.wash_bays as number) ?? 2;
    const slotDur     = (ev.slot_duration_minutes as number) ?? SLOT_DURATION;
    const durBuiten   = (ev.duration_buiten_wassen as number) ?? 20;
    const durCompleet = (ev.duration_compleet      as number) ?? 40;
    const pkgDuration = package_type === "compleet" ? durCompleet : durBuiten;
    const slotsNeeded = computeSlotsNeeded(pkgDuration, slotDur);

    const { count: occ1 } = await supabase
      .from("car_reservations")
      .select("id", { count: "exact", head: true })
      .eq("reservation_date", reservation_date)
      .eq("reservation_time", reservation_time)
      .neq("status", "cancelled");

    if ((occ1 ?? 0) >= washBays) {
      return NextResponse.json({ error: "Dit tijdslot is helaas niet meer beschikbaar." }, { status: 409 });
    }

    // Controleer alle extra slots die dit pakket nodig heeft
    for (let i = 1; i < slotsNeeded; i++) {
      const extraTime = addMinutes(reservation_time, i * slotDur);
      const { count: occExtra } = await supabase
        .from("car_reservations")
        .select("id", { count: "exact", head: true })
        .eq("reservation_date", reservation_date)
        .eq("reservation_time", extraTime)
        .neq("status", "cancelled");

      if ((occExtra ?? 0) >= washBays) {
        return NextResponse.json({ error: "Dit tijdslot is helaas niet meer beschikbaar." }, { status: 409 });
      }
    }

    // ── Database insert ────────────────────────────────────────────────────────
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
        package_duration:  pkgDuration,
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
      console.error("[reserveren] DB insert mislukt:", dbErr);
      throw dbErr;
    }

    console.log("[reserveren] insert gelukt id:", reservation?.id);

    // ── Mails versturen (awaited binnen de request-lifetime) ──────────────────
    try {
      await sendReservationEmail({
        name: full_name, email, phone: phone || null,
        package: package_type,
        date: reservation_date, time: reservation_time,
        duration_min: pkgDuration,
        price, extra_donation: extraDonation,
        notes: notes || null,
      });
      console.log("[reserveren] admin mail verstuurd");
    } catch (e) { console.error("[reserveren] admin mail fout:", e); }

    try {
      await sendReservationConfirmation({
        name: full_name, email,
        package: package_type,
        date: reservation_date, time: reservation_time,
        duration_min: pkgDuration,
        price, extra_donation: extraDonation,
      });
      console.log("[reserveren] bevestigingsmail verstuurd");
    } catch (e) { console.error("[reserveren] bevestigingsmail fout:", e); }

    // Logging (niet-kritiek — eigen try-catch zodat het nooit een 500 veroorzaakt)
    try {
      await supabase.from("email_logs").insert({
        to_address:     process.env.NOTIFY_EMAIL ?? "",
        subject:        `Nieuwe reservering — ${full_name}`,
        template:       "reservation_admin",
        reference_id:   reservation?.id,
        reference_type: "car_reservation",
        status:         "sent",
      });
    } catch (_e) { console.warn("[reserveren] email_logs insert overgeslagen:", (_e as Error)?.message); }

    try {
      await supabase.from("audit_logs").insert({
        action:     "INSERT",
        table_name: "car_reservations",
        record_id:  reservation?.id,
        new_data:   { full_name, email, package_type, reservation_date, reservation_time },
      });
    } catch (_e) { console.warn("[reserveren] audit_logs insert overgeslagen:", (_e as Error)?.message); }

    console.log("[reserveren] success response verzonden");
    return NextResponse.json({ ok: true, id: reservation?.id }, { status: 200 });

  } catch (err) {
    console.error("[api/reserveren] FOUT op stap na DB-insert:", err);
    return NextResponse.json({ error: "Interne fout bij verwerking." }, { status: 500 });
  }
}
