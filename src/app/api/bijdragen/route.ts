import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDonationNotification, sendDonationConfirmation } from "@/lib/email";

const PRESET_AMOUNTS = ["5", "10", "25"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, amount, custom_amount, notes } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Naam en e-mail zijn verplicht." }, { status: 400 });
    }

    // Bedrag bepalen
    let resolvedAmount: number;
    if (amount === "anders") {
      const parsed = parseFloat(String(custom_amount).replace(",", "."));
      if (isNaN(parsed) || parsed <= 0) {
        return NextResponse.json({ error: "Voer een geldig bedrag in." }, { status: 400 });
      }
      resolvedAmount = parsed;
    } else if (PRESET_AMOUNTS.includes(String(amount))) {
      resolvedAmount = Number(amount);
    } else {
      return NextResponse.json({ error: "Kies een geldig bedrag." }, { status: 400 });
    }

    const amountStr = `€${resolvedAmount.toFixed(2).replace(".", ",")}`;
    const supabase  = createAdminClient() as any;

    const { data: record, error: dbErr } = await supabase
      .from("contribution_signups")
      .insert({
        full_name:         name,
        email,
        phone:             phone || null,
        contribution_type: "donatie",
        description:       amountStr,
        sponsorship_type:  "losse_bijdrage",
        notes:             notes || null,
        status:            "pending",
      })
      .select("id")
      .single();

    if (dbErr) {
      console.error("[api/bijdragen] DB fout:", dbErr);
      throw dbErr;
    }

    sendDonationNotification({
      name, email, phone: phone || null, amount: amountStr, notes: notes || null,
    }).catch(e => console.error("[bijdragen] admin mail fout:", e));

    sendDonationConfirmation({ name, email, amount: amountStr })
      .catch(e => console.error("[bijdragen] bevestigingsmail fout:", e));

    supabase.from("email_logs").insert({
      to_address:     process.env.NOTIFY_EMAIL ?? "",
      subject:        `Nieuwe bijdrage — ${name} (${amountStr})`,
      template:       "donation",
      reference_id:   record?.id,
      reference_type: "contribution_signup",
      status:         "sent",
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/bijdragen]", err);
    return NextResponse.json({ error: "Er is iets misgegaan. Probeer het opnieuw." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  // Betaalstatus bijwerken (vanuit admin)
  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: "id en status zijn verplicht." }, { status: 400 });
    }
    const supabase = createAdminClient() as any;
    const { error } = await supabase
      .from("contribution_signups")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/bijdragen PATCH]", err);
    return NextResponse.json({ error: "Opslaan mislukt." }, { status: 500 });
  }
}
