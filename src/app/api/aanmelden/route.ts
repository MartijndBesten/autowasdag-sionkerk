import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendVolunteerEmail, sendVolunteerConfirmation } from "@/lib/email";
import type { AvailabilityType } from "@/lib/supabase/types";

const VALID_AVAIL: AvailabilityType[] = ["full_day", "morning", "afternoon"];
const VALID_COST = ["eigen_kosten", "vergoeding_gewenst", "gesponsord", "weet_ik_nog_niet"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, availability, tasks, contribution_details, cost_preference, notes, selected_supplies } = body;

    // ── Validatie ─────────────────────────────────────────────────────────────
    if (!name || !email) {
      return NextResponse.json({ error: "Naam en e-mail zijn verplicht." }, { status: 400 });
    }
    if (!phone || !String(phone).trim()) {
      return NextResponse.json({ error: "Telefoonnummer is verplicht zodat we je op de dag zelf kunnen bereiken." }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const supabase = createAdminClient() as any;

    // ── Open/gesloten check ────────────────────────────────────────────────────
    const { data: eventRow, error: eventErr } = await supabase
      .from("settings").select("value").eq("key", "event").single();

    if (eventErr) {
      console.error("[aanmelden] settings niet leesbaar:", eventErr.message);
      return NextResponse.json(
        { error: "Aanmelden is tijdelijk niet beschikbaar. Probeer het over enkele minuten opnieuw." },
        { status: 503 }
      );
    }

    const ev = (eventRow?.value as Record<string, unknown>) ?? {};
    if (ev.volunteers_open === false) {
      return NextResponse.json(
        { error: "Aanmelden als vrijwilliger is op dit moment gesloten. Neem contact op met de organisatie als je nog een vraag hebt." },
        { status: 403 }
      );
    }

    // ── Bijdragedetails valideren ──────────────────────────────────────────────
    const taskList: string[] = Array.isArray(tasks) ? tasks : [];
    const details: string    = contribution_details ?? "";

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
      const supplies: string[] = Array.isArray(selected_supplies) ? selected_supplies : [];
      const andersText         = details.split("\n").find(l => l.startsWith("SpullenAnders:"))?.replace("SpullenAnders:", "").trim() ?? "";
      const toelichtingText    = details.split("\n").find(l => l.startsWith("SpullenToelichting:"))?.replace("SpullenToelichting:", "").trim() ?? "";
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

    // ── Database insert ────────────────────────────────────────────────────────
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
      console.error("[aanmelden] DB insert mislukt:", dbErr);
      throw dbErr;
    }

    console.log("[aanmelden] insert gelukt id:", record?.id);

    // ── Mails versturen (awaited binnen de request-lifetime) ──────────────────
    // Elk in eigen try-catch: mailfout blokkeert de 200-response NIET.
    try {
      await sendVolunteerEmail({
        name, email: normalizedEmail, phone: String(phone).trim(),
        availability: safeAvail, tasks: taskList,
        contribution_details: contribution_details || null,
        cost_preference: taskList.includes("bakken") ? (cost_preference || null) : null,
        notes: notes || null,
      });
      console.log("[aanmelden] admin mail verstuurd");
    } catch (e) { console.error("[aanmelden] admin mail fout:", e); }

    try {
      await sendVolunteerConfirmation({
        name, email: normalizedEmail,
        availability: safeAvail, tasks: taskList,
        contribution_details: contribution_details || null,
        cost_preference: taskList.includes("bakken") ? (cost_preference || null) : null,
      });
      console.log("[aanmelden] bevestigingsmail verstuurd");
    } catch (e) { console.error("[aanmelden] bevestigingsmail fout:", e); }

    // Logging (niet-kritiek, fire-and-forget)
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

    console.log("[aanmelden] success response verzonden");
    return NextResponse.json({ ok: true }, { status: 200 });

  } catch (err) {
    console.error("[api/aanmelden] FOUT:", err);
    return NextResponse.json({ error: "Interne fout." }, { status: 500 });
  }
}
