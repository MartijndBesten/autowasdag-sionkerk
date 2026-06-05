import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReservationEmail, sendReservationConfirmation } from "@/lib/email";
import { PACKAGE_SLOTS } from "@/lib/timeslots";
import type { PackageType } from "@/lib/supabase/types";

const VALID_PACKAGES: PackageType[] = ["buiten_wassen", "compleet"];

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

    if (!full_name || !email || !package_type || !reservation_date || !reservation_time) {
      return NextResponse.json({ error: "Verplichte velden ontbreken." }, { status: 400 });
    }
    if (!VALID_PACKAGES.includes(package_type)) {
      return NextResponse.json({ error: "Ongeldig pakket." }, { status: 400 });
    }

    const supabase = createAdminClient() as any;

    const slotsNeeded = PACKAGE_SLOTS[package_type as PackageType];
    const { data: settings } = await supabase
      .from("settings").select("value").eq("key", "event").single();
    const washBays = ((settings?.value as Record<string, unknown>)?.wash_bays as number) ?? 2;

    // Check 1: huidig slot — count(*) op status ≠ cancelled (niet sum slot_count)
    const { count: occ1 } = await supabase
      .from("car_reservations")
      .select("id", { count: "exact", head: true })
      .eq("reservation_date", reservation_date)
      .eq("reservation_time", reservation_time)
      .neq("status", "cancelled");

    if ((occ1 ?? 0) >= washBays) {
      return NextResponse.json({ error: "Dit tijdslot is helaas niet meer beschikbaar." }, { status: 409 });
    }

    // Check 2: compleet-pakket bezet ook het volgende 20-minuten-slot
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

    // Opslaan — slot_count 1 (één auto = één wasplaats), status confirmed
    const { data: reservation, error: dbErr } = await supabase
      .from("car_reservations")
      .insert({
        full_name,
        phone:             phone         || null,
        email,
        license_plate:     license_plate || null,
        package_type:      package_type as PackageType,
        package_duration:  slotsNeeded * 20,
        reservation_date,
        reservation_time,
        extra_donation:    Number(extra_donation) || 0,
        notes:             notes || null,
        slot_count:        1,
        status:            "confirmed",
        payment_status:    "unpaid",
        confirmation_sent: false,
      })
      .select("id, cancellation_token")
      .single();

    if (dbErr) throw dbErr;

    sendReservationEmail({
      name: full_name, email, phone: phone || null, package: package_type, notes: notes || null,
    }).catch(console.error);

    sendReservationConfirmation({
      name: full_name, email, package: package_type,
      date: reservation_date, time: reservation_time,
    }).catch(console.error);

    await supabase.from("email_logs").insert({
      to_address:     process.env.NOTIFY_EMAIL ?? "",
      subject:        `Nieuwe reservering — ${full_name}`,
      template:       "reservation_admin",
      reference_id:   reservation?.id,
      reference_type: "car_reservation",
      status:         "sent",
    });

    await supabase.from("audit_logs").insert({
      action:     "INSERT",
      table_name: "car_reservations",
      record_id:  reservation?.id,
      new_data:   { full_name, email, package_type, reservation_date, reservation_time },
    });

    return NextResponse.json({ ok: true, id: reservation?.id });
  } catch (err) {
    console.error("[api/reserveren]", err);
    return NextResponse.json({ error: "Interne fout bij verwerking." }, { status: 500 });
  }
}
