import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient }      from "@/lib/supabase/server";
import { sendVolunteerConfirmation } from "@/lib/email";

function validEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}
function logTs(): string {
  const now = new Date(); const p = (n: number) => String(n).padStart(2,"0");
  return `${p(now.getDate())}-${p(now.getMonth()+1)}-${now.getFullYear()} ${p(now.getHours())}:${p(now.getMinutes())}`;
}
function appendLog(existing: string | null, entry: string): string {
  return existing ? `${existing}\n${entry}` : entry;
}

// ── PUT: bewerk vrijwilligersgegevens ────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sessionClient = await createClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const { data: adminUser } = await sessionClient.from("admin_users")
      .select("id").eq("id", user.id).eq("is_active", true).single();
    if (!adminUser) return NextResponse.json({ error: "Geen toegang." }, { status: 403 });

    const body = await req.json();
    const { full_name, email, phone, availability, notes, contribution_details, cost_preference, selected_tasks, selected_supplies } = body;

    if (!full_name?.trim()) return NextResponse.json({ error: "Naam is verplicht." }, { status: 400 });
    if (email && !validEmail(email)) return NextResponse.json({ error: "Ongeldig e-mailadres." }, { status: 400 });

    const supabase = createAdminClient() as any;

    // Huidige record voor log
    const { data: cur } = await supabase
      .from("volunteer_signups")
      .select("full_name, email, phone, availability, notes, contribution_details, cost_preference, selected_tasks, selected_supplies, admin_notes")
      .eq("id", id).single();

    const AVAIL_LBL: Record<string,string> = { full_day:"Hele dag", morning:"Ochtend", afternoon:"Middag" };
    const COST_LBL:  Record<string,string> = { eigen_kosten:"Eigen kosten", vergoeding_gewenst:"Vergoeding gewenst", gesponsord:"Gesponsord", weet_ik_nog_niet:"Weet ik nog niet" };
    const ts = logTs();
    const logLines: string[] = [];

    const textFields: [string, string, string | null | undefined][] = [
      ["Naam",         full_name?.trim(),                              cur?.full_name],
      ["E-mailadres",  email?.trim().toLowerCase(),                   cur?.email],
      ["Telefoon",     phone?.trim() || null,                         cur?.phone],
      ["Opmerking",    notes?.trim() || null,                         cur?.notes],
    ];
    for (const [label, nv, ov] of textFields) {
      if (nv !== undefined && (nv ?? "") !== (ov ?? "")) {
        logLines.push(`${ts}  ${label}: ${ov ?? "—"} → ${nv ?? "—"}`);
      }
    }
    if (availability && availability !== cur?.availability) {
      logLines.push(`${ts}  Beschikbaarheid: ${AVAIL_LBL[cur?.availability] ?? cur?.availability ?? "—"} → ${AVAIL_LBL[availability] ?? availability}`);
    }
    if (cost_preference !== undefined && cost_preference !== cur?.cost_preference) {
      logLines.push(`${ts}  Kosten/sponsoring: ${COST_LBL[cur?.cost_preference ?? ""] ?? cur?.cost_preference ?? "—"} → ${COST_LBL[cost_preference ?? ""] ?? cost_preference ?? "—"}`);
    }
    if (Array.isArray(selected_tasks)) {
      const oldT = (cur?.selected_tasks ?? []).join(", ") || "—";
      const newT = selected_tasks.join(", ") || "—";
      if (oldT !== newT) logLines.push(`${ts}  Gewenste taken: ${oldT} → ${newT}`);
    }
    if (contribution_details !== undefined && (contribution_details ?? "") !== (cur?.contribution_details ?? "")) {
      logLines.push(`${ts}  Bijdragedetails gewijzigd`);
    }

    const newAdminNotes = logLines.length > 0
      ? appendLog(cur?.admin_notes, logLines.join("\n"))
      : (cur?.admin_notes ?? null);

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString(), admin_notes: newAdminNotes };
    if (full_name)                    updates.full_name            = full_name.trim();
    if (email)                        updates.email                = email.trim().toLowerCase();
    if (phone !== undefined)          updates.phone                = phone?.trim() || null;
    if (availability)                 updates.availability         = availability;
    if (notes !== undefined)          updates.notes                = notes?.trim() || null;
    if (contribution_details !== undefined) updates.contribution_details = contribution_details || null;
    if (cost_preference !== undefined)      updates.cost_preference      = cost_preference || null;
    if (Array.isArray(selected_tasks))      updates.selected_tasks       = selected_tasks;
    if (Array.isArray(selected_supplies))   updates.selected_supplies    = selected_supplies;

    const { error } = await supabase.from("volunteer_signups").update(updates).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true, log_entries: logLines.length });
  } catch (err) {
    console.error("[api/vrijwilligers/[id] PUT]", err);
    return NextResponse.json({ error: "Opslaan mislukt." }, { status: 500 });
  }
}

// ── POST: stuur bevestigingsmail opnieuw naar vrijwilliger ───────────────────
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sessionClient = await createClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const { data: adminUser } = await sessionClient.from("admin_users")
      .select("id").eq("id", user.id).eq("is_active", true).single();
    if (!adminUser) return NextResponse.json({ error: "Geen toegang." }, { status: 403 });

    const supabase = createAdminClient() as any;
    const { data: vol } = await supabase
      .from("volunteer_signups")
      .select("full_name, email, availability, selected_tasks, contribution_details, cost_preference")
      .eq("id", id).single();

    if (!vol) return NextResponse.json({ error: "Vrijwilliger niet gevonden." }, { status: 404 });

    await sendVolunteerConfirmation({
      name:                 vol.full_name,
      email:                vol.email,
      availability:         vol.availability,
      tasks:                vol.selected_tasks ?? [],
      contribution_details: vol.contribution_details ?? null,
      cost_preference:      vol.cost_preference ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/vrijwilligers/[id] POST]", err);
    return NextResponse.json({ error: "E-mail versturen mislukt." }, { status: 500 });
  }
}

// ── DELETE: soft-delete vrijwilliger ─────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sessionClient = await createClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const { data: adminUser } = await sessionClient.from("admin_users")
      .select("id").eq("id", user.id).eq("is_active", true).single();
    if (!adminUser) return NextResponse.json({ error: "Geen toegang." }, { status: 403 });

    const supabase = createAdminClient() as any;
    const { error } = await supabase
      .from("volunteer_signups")
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/vrijwilligers/[id] DELETE]", err);
    return NextResponse.json({ error: "Interne fout." }, { status: 500 });
  }
}

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
