import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendVolunteerEmail } from "@/lib/email";
import type { AvailabilityType } from "@/lib/supabase/types";

const VALID_AVAIL: AvailabilityType[] = ["full_day", "morning", "afternoon"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, availability, tasks, notes } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Naam en e-mail zijn verplicht." }, { status: 400 });
    }

    const supabase = createAdminClient() as any;
    const safeAvail: AvailabilityType = VALID_AVAIL.includes(availability) ? availability : "full_day";

    const { data: record, error: dbErr } = await supabase
      .from("volunteer_signups")
      .insert({
        full_name:    name,
        email,
        phone:        phone || null,
        availability: safeAvail,
        selected_tasks: Array.isArray(tasks) ? tasks : [],
        notes:        notes || null,
        status:       "pending",
      })
      .select("id")
      .single();

    if (dbErr) throw dbErr;

    sendVolunteerEmail({ name, email, phone: phone || null, availability: safeAvail, tasks: tasks ?? [], notes: notes || null })
      .catch(console.error);

    await supabase.from("email_logs").insert({
      to_address: "m.denbesten@live.nl", subject: `Nieuwe vrijwilliger — ${name}`,
      template: "volunteer_admin", reference_id: record?.id, reference_type: "volunteer_signup", status: "sent",
    });

    await supabase.from("audit_logs").insert({
      action: "INSERT", table_name: "volunteer_signups", record_id: record?.id,
      new_data: { full_name: name, email, selected_tasks: tasks },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/aanmelden]", err);
    return NextResponse.json({ error: "Interne fout." }, { status: 500 });
  }
}
