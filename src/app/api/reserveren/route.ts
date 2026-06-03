import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReservationEmail, sendReservationConfirmation } from "@/lib/email";
import { PACKAGE_SLOTS } from "@/lib/timeslots";
import type { PackageType } from "@/lib/supabase/types";

const VALID_PACKAGES: PackageType[] = ["buiten_wassen", "binnen_zuigen", "compleet"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      full_name, phone, email, license_plate,
      package_type, reservation_date, reservation_time,
      extra_donation, notes,
    } = body;

    // Validatie
    if (!full_name || !email || !package_type || !reservation_date || !reservation_time) {
      return NextResponse.json({ error: "Verplichte velden ontbreken." }, { status: 400 });
    }
    if (!VALID_PACKAGES.includes(package_type)) {
      return NextResponse.json({ error: "Ongeldig pakket." }, { status: 400 });
    }

    const supabase = createAdminClient() as any;

    // Controleer beschikbaarheid (race-condition safe via DB)
    const slotsNeeded = PACKAGE_SLOTS[package_type as PackageType];
    const { data: settings } = await supabase
      .from("settings").select("value").eq("key", "event").single();
    const washBays = ((settings?.value as Record<string,unknown>)?.wash_bays as number) ?? 2;

    // Controleer huidig slot
    const { data: occupancy } = await supabase
      .rpc("get_slot_occupancy", {
        p_date: reservation_date,
        p_time: reservation_time,
      });
    if ((occupancy ?? 0) + slotsNeeded > washBays * slotsNeeded) {
      return NextResponse.json({ error: "Dit tijdslot is helaas niet meer beschikbaar." }, { status: 409 });
    }

    // Opslaan
    const { data: reservation, error: dbErr } = await supabase
      .from("car_reservations")
      .insert({
        full_name,
        phone:             phone      || null,
        email,
        license_plate:     license_plate || null,
        package_type:      package_type as PackageType,
        package_duration:  slotsNeeded * 20,
        reservation_date,
        reservation_time,
        extra_donation:    Number(extra_donation) || 0,
        notes:             notes || null,
        slot_count:        slotsNeeded,
        status:            "pending",
        payment_status:    "unpaid",
        confirmation_sent: false,
      })
      .select("id, cancellation_token")
      .single();

    if (dbErr) throw dbErr;

    // Admin-notificatie
    sendReservationEmail({
      name: full_name, email, phone: phone || null, package: package_type, notes: notes || null,
    }).catch(console.error);

    // Bevestiging naar bezoeker
    sendReservationConfirmation({
      name: full_name, email, package: package_type,
      date: reservation_date, time: reservation_time,
    }).catch(console.error);

    // Log e-mail
    await supabase.from("email_logs").insert({
      to_address:     "m.denbesten@live.nl",
      subject:        `Nieuwe reservering — ${full_name}`,
      template:       "reservation_admin",
      reference_id:   reservation?.id,
      reference_type: "car_reservation",
      status:         "sent",
    });

    // Audit log
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
