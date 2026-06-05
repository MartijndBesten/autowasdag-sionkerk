import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Tijdelijk endpoint om DB-prijzen bij te werken
// POST /api/debug/prices?token=PRICE2026

export async function POST(req: Request) {
  const t = new URL(req.url).searchParams.get("token");
  if (t !== "PRICE2026") return NextResponse.json({ error: "403" }, { status: 403 });
  const supabase = createAdminClient() as any;
  const NEW = { buiten_wassen: 10.00, compleet: 15.00 };

  // Update prices key
  await supabase.from("settings")
    .upsert({ key: "prices", value: NEW }, { onConflict: "key" });

  // Update price_buiten_wassen + price_compleet in sitecontent (voor homepage pakketten)
  const { data: sc } = await supabase.from("settings").select("value").eq("key","sitecontent").single();
  if (sc?.value) {
    await supabase.from("settings")
      .update({ value: { ...sc.value, price_buiten_wassen: 10.00, price_compleet: 15.00 } })
      .eq("key","sitecontent");
  }

  const { data: ev } = await supabase.from("settings").select("value").eq("key","prices").single();
  return NextResponse.json({ ok: true, prices_in_db: ev?.value, sitecontent_updated: !!sc?.value });
}
