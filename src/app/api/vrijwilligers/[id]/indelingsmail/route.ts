import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendAssignmentEmail } from "@/lib/email";
import { formatEventDate } from "@/lib/event";
import type { VolunteerSignup } from "@/lib/supabase/types";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auth: alleen admins
    const sessionClient = await createClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const { data: adminUser } = await sessionClient.from("admin_users")
      .select("id").eq("id", user.id).eq("is_active", true).single();
    if (!adminUser) return NextResponse.json({ error: "Geen toegang." }, { status: 403 });

    const supabase = createAdminClient() as any;
    const { data: v, error: fetchErr } = await supabase
      .from("volunteer_signups")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !v) return NextResponse.json({ error: "Vrijwilliger niet gevonden." }, { status: 404 });

    const row = v as VolunteerSignup;

    // Validatie: definitieve taak + dagdeel verplicht (tenzij reserve of not_needed)
    const skipCheck = ["reserve", "not_needed"].includes(row.planning_status);
    if (!skipCheck) {
      if (!row.final_tasks || row.final_tasks.length === 0) {
        return NextResponse.json({ error: "Stel eerst een definitieve taak in." }, { status: 422 });
      }
      if (!row.final_shift || row.final_shift === "not_chosen") {
        return NextResponse.json({ error: "Stel eerst een definitief dagdeel/tijd in." }, { status: 422 });
      }
    }

    const { data: settings } = await supabase
      .from("settings").select("value").eq("key", "sitecontent").single();
    const eventDate: string | null = (settings?.value as Record<string, unknown>)?.event_date as string ?? null;
    const eventDateFormatted = eventDate ? formatEventDate(eventDate) : null;

    const result = await sendAssignmentEmail({
      name:                 row.full_name,
      email:                row.email,
      final_tasks:          row.final_tasks ?? [],
      final_shift:          row.final_shift ?? "not_chosen",
      final_start_time:     row.final_start_time,
      final_end_time:       row.final_end_time,
      contribution_details: row.contribution_details,
      cost_preference:      row.cost_preference,
      event_date_formatted: eventDateFormatted,
    });

    if (!result.ok) {
      console.error("[indelingsmail] Mislukt voor", row.email, ":", result.error);
      return NextResponse.json({ error: result.error ?? "Verzenden mislukt." }, { status: 500 });
    }

    const sentAt = new Date().toISOString();
    await supabase
      .from("volunteer_signups")
      .update({
        planning_status:          "assignment_sent",
        assignment_email_sent:    true,
        assignment_email_sent_at: sentAt,
        updated_at:               sentAt,
      })
      .eq("id", id);

    await supabase.from("email_logs").insert({
      to_address:     row.email,
      subject:        "Je indeling voor de Autowasdag",
      template:       "volunteer_assignment",
      reference_id:   id,
      reference_type: "volunteer_signup",
      status:         "sent",
    });

    return NextResponse.json({ ok: true, sent_at: sentAt });
  } catch (err) {
    console.error("[indelingsmail] Onverwachte fout:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Interne fout." }, { status: 500 });
  }
}
