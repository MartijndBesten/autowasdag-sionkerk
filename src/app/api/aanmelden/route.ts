import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendVolunteerEmail, sendVolunteerConfirmation } from "@/lib/email";
import type { AvailabilityType } from "@/lib/supabase/types";

const VALID_AVAIL: AvailabilityType[] = ["full_day", "morning", "afternoon"];
const VALID_COST = ["eigen_kosten", "vergoeding_gewenst", "gesponsord", "weet_ik_nog_niet"];

export async function POST(req: NextRequest) {
  try {
    console.log("[aanmelden] start");
    const body = await req.json();
    const { name, email, phone, availability, tasks, contribution_details, cost_preference, notes, selected_supplies } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Naam en e-mail zijn verplicht." }, { status: 400 });
    }

    // Telefoon verplicht
    if (!phone || !String(phone).trim()) {
      return NextResponse.json({ error: "Telefoonnummer is verplicht zodat we je op de dag zelf kunnen bereiken." }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    console.log("[aanmelden] validatie ok, supabase aanmaken");
    const supabase = createAdminClient() as any;

    // ── Open/gesloten check (defensief: bij fout behandelen als open) ────────────
    let volunteersOpen = true;
    try {
      console.log("[aanmelden] open/gesloten check");
      const { data: eventRow, error: eventErr } = await supabase
        .from("settings").select("value").eq("key", "event").single();
      if (eventErr) {
        console.warn("[aanmelden] settings ophalen mislukt:", eventErr.message);
      } else {
        const ev = (eventRow?.value as Record<string, unknown>) ?? {};
        if (ev.volunteers_open === false) volunteersOpen = false;
        console.log("[aanmelden] volunteers_open =", ev.volunteers_open);
      }
    } catch (e) {
      console.warn("[aanmelden] open/gesloten check crashed:", e);
    }

    if (!volunteersOpen) {
      return NextResponse.json(
        { error: "Aanmelden als vrijwilliger is op dit moment gesloten. Neem contact op met de organisatie als je nog een vraag hebt." },
        { status: 403 }
      );
    }

    // ── Dubbele aanmelding voorkomen (defensief: bij fout doorgaan) ─────────────
    try {
      console.log("[aanmelden] dubbele aanmelding check");
      const { count: existing, error: dupErr } = await supabase
        .from("volunteer_signups")
        .select("id", { count: "exact", head: true })
        .eq("email", normalizedEmail)
        .eq("is_deleted", false);

      if (dupErr) {
        console.warn("[aanmelden] duplicaat-check fout:", dupErr.message);
      } else if ((existing ?? 0) > 0) {
        return NextResponse.json(
          { error: "Er bestaat al een aanmelding met dit e-mailadres. Wil je iets wijzigen? Neem dan contact op met de organisatie." },
          { status: 409 }
        );
      }
    } catch (e) {
      console.warn("[aanmelden] duplicaat-check crashed:", e);
    }

    const taskList: string[] = Array.isArray(tasks) ? tasks : [];
    const details: string    = contribution_details ?? "";

    // ── Server-side validatie bijdragedetails ──────────────────────────────────
    if (taskList.includes("bakken")) {
      const bakkenLine = details.split("\n").find(l => l.startsWith("Bakken:"));
      if (!bakkenLine || bakkenLine.replace("Bakken:", "").trim().length === 0) {
        return NextResponse.json({ error: "Geef aan wat je gaat bakken." }, { status: 400 });
      }
      if (!cost_preference || !VALID_COST.includes(cost_preference)) {
        return NextResponse.json({ error: "Geef aan hoe de kosten van het bakken worden gedekt." }, { status: 400 });
      }
    }
    if (taskList.includes("spullen")) {
      const supplies: string[]   = Array.isArray(selected_supplies) ? selected_supplies : [];
      const andersText           = details.split("\n").find(l => l.startsWith("SpullenAnders:"))?.replace("SpullenAnders:", "").trim() ?? "";
      const toelichtingText      = details.split("\n").find(l => l.startsWith("SpullenToelichting:"))?.replace("SpullenToelichting:", "").trim() ?? "";
      if (supplies.length === 0 && !andersText && !toelichtingText) {
        return NextResponse.json({ error: "Kies minimaal één spullenoptie of vul een toelichting in." }, { status: 400 });
      }
      if (supplies.includes("anders") && !andersText) {
        return NextResponse.json({ error: "Vul in wat je nog meer meeneemt bij 'Anders, namelijk'." }, { status: 400 });
      }
    }
    if (taskList.includes("sponsoring")) {
      const sponsoringLine = details.split("\n").find(l => l.startsWith("Sponsoring:"));
      if (!sponsoringLine || sponsoringLine.replace("Sponsoring:", "").trim().length === 0) {
        return NextResponse.json({ error: "Geef aan hoe je wilt bijdragen als sponsor/verkoper." }, { status: 400 });
      }
    }

    const safeAvail: AvailabilityType = VALID_AVAIL.includes(availability) ? availability : "full_day";

    console.log("[aanmelden] insert vrijwilliger");
    const { data: record, error: dbErr } = await supabase
      .from("volunteer_signups")
      .insert({
        full_name:            name,
        email:                normalizedEmail,
        phone:                String(phone).trim(),
        availability:         safeAvail,
        selected_tasks:       taskList,
        contribution_details: contribution_details || null,
        cost_preference:      taskList.includes("bakken") ? (cost_preference || null) : null,
        notes:                notes || null,
        status:               "confirmed",
        planning_status:      "new",
        selected_supplies:    taskList.includes("spullen") ? (Array.isArray(selected_supplies) ? selected_supplies : []) : [],
      })
      .select("id")
      .single();

    if (dbErr) {
      console.error("[aanmelden] DB insert fout:", dbErr);
      throw dbErr;
    }

    console.log("[aanmelden] insert gelukt, mails versturen");

    sendVolunteerEmail({
      name, email: normalizedEmail, phone: String(phone).trim(),
      availability: safeAvail, tasks: taskList,
      contribution_details: contribution_details || null,
      cost_preference: taskList.includes("bakken") ? (cost_preference || null) : null,
      notes: notes || null,
    }).catch(e => console.error("[aanmelden] admin mail fout:", e));

    sendVolunteerConfirmation({
      name, email: normalizedEmail,
      availability: safeAvail, tasks: taskList,
      contribution_details: contribution_details || null,
      cost_preference: taskList.includes("bakken") ? (cost_preference || null) : null,
    }).catch(e => console.error("[aanmelden] bevestigingsmail fout:", e));

    supabase.from("email_logs").insert({
      to_address:     process.env.NOTIFY_EMAIL ?? "",
      subject:        `Nieuwe vrijwilliger — ${name}`,
      template:       "volunteer_admin",
      reference_id:   record?.id,
      reference_type: "volunteer_signup",
      status:         "sent",
    }).catch(() => {});

    supabase.from("audit_logs").insert({
      action:     "INSERT",
      table_name: "volunteer_signups",
      record_id:  record?.id,
      new_data:   { full_name: name, email: normalizedEmail, selected_tasks: taskList },
    }).catch(() => {});

    console.log("[aanmelden] succes");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/aanmelden] FOUT:", err);
    return NextResponse.json({ error: "Interne fout." }, { status: 500 });
  }
}
