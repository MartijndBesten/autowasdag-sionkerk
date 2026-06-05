import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Tijdelijk export-endpoint — verwijder na gebruik
// GET /api/debug/export?token=EXPORT2026

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (token !== "EXPORT2026") {
    return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  }

  const supabase = createAdminClient() as any;

  const [res, vol, con, sett] = await Promise.all([
    supabase.from("car_reservations").select("*").order("created_at"),
    supabase.from("volunteer_signups").select("*").order("created_at"),
    supabase.from("contribution_signups").select("*").order("created_at"),
    supabase.from("settings").select("*"),
  ]);

  // Email logs en audit logs (kunnen groot zijn)
  const [emlogs, audlogs] = await Promise.all([
    supabase.from("email_logs").select("*").order("created_at").limit(500),
    supabase.from("audit_logs").select("*").order("created_at").limit(500),
  ]);

  return NextResponse.json({
    exported_at: new Date().toISOString(),
    tables: {
      car_reservations:    { count: res.data?.length ?? 0,    data: res.data    ?? [], error: res.error?.message },
      volunteer_signups:   { count: vol.data?.length ?? 0,    data: vol.data    ?? [], error: vol.error?.message },
      contribution_signups:{ count: con.data?.length ?? 0,    data: con.data    ?? [], error: con.error?.message },
      settings:            { count: sett.data?.length ?? 0,   data: sett.data   ?? [], error: sett.error?.message },
      email_logs:          { count: emlogs.data?.length ?? 0, data: emlogs.data ?? [], error: emlogs.error?.message },
      audit_logs:          { count: audlogs.data?.length ?? 0,data: audlogs.data?? [], error: audlogs.error?.message },
    },
  });
}
