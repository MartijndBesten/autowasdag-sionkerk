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

// Eenvoudige e-mailvalidatie
function validEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

// Formateer een wijzigingslogregel met Nederlandse timestamp
function logTs(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(now.getDate())}-${pad(now.getMonth()+1)}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function appendLog(existing: string | null, entry: string): string {
  return existing ? `${existing}\n${entry}` : entry;
}

// ── PUT: bewerk reserveringsgegevens ─────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await createClient();
    const { data: { user } } = await session.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const body = await req.json();
    const {
      full_name, email, phone, notes,
      package_type, reservation_date,
      status, payment_status,
    } = body;

    if (!full_name?.trim()) {
      return NextResponse.json({ error: "Naam is verplicht." }, { status: 400 });
    }
    if (email && !validEmail(email)) {
      return NextResponse.json({ error: "Ongeldig e-mailadres." }, { status: 400 });
    }

    const supabase = createAdminClient() as any;

    // Huidige record ophalen voor wijzigingslog
    const { data: current } = await supabase
      .from("car_reservations")
      .select("full_name, email, phone, notes, package_type, reservation_date, status, payment_status, admin_notes")
      .eq("id", id).single();

    // Diff berekenen en wijzigingslog bouwen
    const FIELD_LABELS: Record<string, string> = {
      full_name: "Naam", email: "E-mailadres", phone: "Telefoon",
      notes: "Notities", package_type: "Pakket",
      reservation_date: "Datum", status: "Status", payment_status: "Betaalstatus",
    };
    const PACKAGE_LBL: Record<string, string> = { buiten_wassen: "Buiten wassen", compleet: "Compleet" };
    const STATUS_LBL: Record<string, string>  = { pending:"In behandeling", confirmed:"Bevestigd", completed:"Afgerond", cancelled:"Geannuleerd" };
    const PAY_LBL: Record<string, string>     = { unpaid:"Nog te betalen", paid_cash:"Betaald contant", paid_qr:"Betaald via QR", donated_extra:"Extra donatie" };

    const incoming: Record<string, string | null | undefined> = {
      full_name, email: email?.trim().toLowerCase(), phone: phone?.trim() || null,
      notes: notes?.trim() || null, package_type, reservation_date,
      status, payment_status,
    };

    const ts = logTs();
    const logLines: string[] = [];
    for (const [key, newVal] of Object.entries(incoming)) {
      if (newVal === undefined) continue;
      const oldVal = current?.[key] ?? null;
      const normalNew = newVal ?? "";
      const normalOld = oldVal ?? "";
      if (normalNew !== normalOld) {
        const label = FIELD_LABELS[key] ?? key;
        const fmt = (v: string) => {
          if (key === "package_type") return PACKAGE_LBL[v] ?? v;
          if (key === "status") return STATUS_LBL[v] ?? v;
          if (key === "payment_status") return PAY_LBL[v] ?? v;
          return v || "—";
        };
        logLines.push(`${ts}  ${label}: ${fmt(normalOld)} → ${fmt(normalNew)}`);
      }
    }

    const newAdminNotes = logLines.length > 0
      ? appendLog(current?.admin_notes, logLines.join("\n"))
      : (current?.admin_notes ?? null);

    // Pakketduur ophalen als pakket wijzigt
    let pkgDuration: number | undefined;
    if (package_type && package_type !== current?.package_type) {
      const { data: evRow } = await supabase.from("settings").select("value").eq("key","event").single();
      const ev = (evRow?.value as Record<string,unknown>) ?? {};
      pkgDuration = package_type === "compleet"
        ? ((ev.duration_compleet as number) ?? 40)
        : ((ev.duration_buiten_wassen as number) ?? 20);
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString(), admin_notes: newAdminNotes };
    if (full_name)          updates.full_name         = full_name.trim();
    if (email)              updates.email             = email.trim().toLowerCase();
    if (phone !== undefined)updates.phone             = phone?.trim() || null;
    if (notes !== undefined)updates.notes             = notes?.trim() || null;
    if (package_type)       updates.package_type      = package_type;
    if (pkgDuration)        updates.package_duration  = pkgDuration;
    if (reservation_date)   updates.reservation_date  = reservation_date;
    if (status)             updates.status            = status;
    if (payment_status)     updates.payment_status    = payment_status;

    const { error: updateErr } = await supabase.from("car_reservations").update(updates).eq("id", id);
    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true, log_entries: logLines.length });
  } catch (err) {
    console.error("[api/reserveren/[id] PUT]", err);
    return NextResponse.json({ error: "Opslaan mislukt." }, { status: 500 });
  }
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
    const price  = prices[res.package_type] ?? (res.package_type === "compleet" ? 15.00 : 10.00);

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
