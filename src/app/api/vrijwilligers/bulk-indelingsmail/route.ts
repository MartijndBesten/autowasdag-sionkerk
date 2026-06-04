import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendAssignmentEmail } from "@/lib/email";
import { formatEventDate } from "@/lib/event";
import type { VolunteerSignup } from "@/lib/supabase/types";

export async function POST(req: NextRequest) {
  try {
    const sessionClient = await createClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const { data: adminUser } = await sessionClient.from("admin_users")
      .select("id").eq("id", user.id).eq("is_active", true).single();
    if (!adminUser) return NextResponse.json({ error: "Geen toegang." }, { status: 403 });

    const body = await req.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
    if (ids.length === 0) return NextResponse.json({ error: "Geen IDs opgegeven." }, { status: 400 });

    const supabase = createAdminClient() as any;

    const { data: settings } = await supabase
      .from("settings").select("value").eq("key", "sitecontent").single();
    const eventDate: string | null = (settings?.value as Record<string, unknown>)?.event_date as string ?? null;
    const eventDateFormatted = eventDate ? formatEventDate(eventDate) : null;

    const { data: volunteers, error: fetchErr } = await supabase
      .from("volunteer_signups")
      .select("*")
      .in("id", ids)
      .eq("is_deleted", false);

    if (fetchErr) throw fetchErr;

    const sentAt = new Date().toISOString();
    const results: { id: string; ok: boolean; name: string; error?: string }[] = [];

    for (const v of (volunteers ?? []) as VolunteerSignup[]) {
      const skipCheck = ["reserve", "not_needed"].includes(v.planning_status);
      if (!skipCheck) {
        if (!v.final_tasks || v.final_tasks.length === 0) {
          results.push({ id: v.id, ok: false, name: v.full_name, error: "Geen definitieve taak ingesteld." });
          continue;
        }
        if (!v.final_shift || v.final_shift === "not_chosen") {
          results.push({ id: v.id, ok: false, name: v.full_name, error: "Geen definitief dagdeel ingesteld." });
          continue;
        }
      }

      const result = await sendAssignmentEmail({
        name:                 v.full_name,
        email:                v.email,
        final_tasks:          v.final_tasks ?? [],
        final_shift:          v.final_shift ?? "not_chosen",
        final_start_time:     v.final_start_time,
        final_end_time:       v.final_end_time,
        contribution_details: v.contribution_details,
        cost_preference:      v.cost_preference,
        event_date_formatted: eventDateFormatted,
      });

      if (result.ok) {
        await supabase.from("volunteer_signups").update({
          planning_status:          "assignment_sent",
          assignment_email_sent:    true,
          assignment_email_sent_at: sentAt,
          updated_at:               sentAt,
        }).eq("id", v.id);

        await supabase.from("email_logs").insert({
          to_address:     v.email,
          subject:        "Je indeling voor de Autowasdag",
          template:       "volunteer_assignment",
          reference_id:   v.id,
          reference_type: "volunteer_signup",
          status:         "sent",
        });

        results.push({ id: v.id, ok: true, name: v.full_name });
      } else {
        results.push({ id: v.id, ok: false, name: v.full_name, error: "Verzenden mislukt." });
      }
    }

    return NextResponse.json({ results, sent_at: sentAt });
  } catch (err) {
    console.error("[api/vrijwilligers/bulk-indelingsmail]", err);
    return NextResponse.json({ error: "Interne fout." }, { status: 500 });
  }
}
