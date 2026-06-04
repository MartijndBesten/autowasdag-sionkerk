import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auth: alleen ingelogde admins
    const sessionClient = await createClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const { data: adminUser } = await sessionClient.from("admin_users")
      .select("id").eq("id", user.id).eq("is_active", true).single();
    if (!adminUser) return NextResponse.json({ error: "Geen toegang." }, { status: 403 });

    const body = await req.json();
    const {
      final_tasks, final_shift, final_start_time,
      final_end_time, internal_note, planning_status,
    } = body;

    const supabase = createAdminClient() as any;
    const { error } = await supabase
      .from("volunteer_signups")
      .update({
        final_tasks:      Array.isArray(final_tasks) ? final_tasks : [],
        final_shift:      final_shift ?? "not_chosen",
        final_start_time: final_start_time || null,
        final_end_time:   final_end_time   || null,
        internal_note:    internal_note    || null,
        planning_status:  planning_status  ?? "new",
        updated_at:       new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/vrijwilligers/[id]]", err);
    return NextResponse.json({ error: "Interne fout." }, { status: 500 });
  }
}
