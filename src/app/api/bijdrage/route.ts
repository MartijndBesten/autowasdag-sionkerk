import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBakingEmail, sendMaterialsEmail, sendSponsorEmail } from "@/lib/email";
import type { ContributionType } from "@/lib/supabase/types";

const TYPE_MAP: Record<string, ContributionType> = {
  baking:    "bakken",
  materials: "spullen",
  sponsor:   "sponsoring",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, name, email, phone, notes, ...rest } = body;

    if (!type || !name || !email) {
      return NextResponse.json({ error: "Type, naam en e-mail zijn verplicht." }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase     = createAdminClient() as any;
    const dbType       = TYPE_MAP[type] ?? "overig" as ContributionType;
    let description    = "";
    let emailSent      = false;

    if (type === "baking") {
      if (!rest.item_description) return NextResponse.json({ error: "Omschrijving verplicht." }, { status: 400 });
      description = `${rest.item_description} (${rest.quantity ?? 1}x)${rest.dietary_info ? `, ${rest.dietary_info}` : ""}`;
      sendBakingEmail({ name, email, phone: phone || null, item_description: rest.item_description, quantity: Number(rest.quantity) || 1, dietary_info: rest.dietary_info || null, notes: notes || null }).catch(console.error);
      emailSent = true;
    } else if (type === "materials") {
      if (!rest.item_description) return NextResponse.json({ error: "Omschrijving verplicht." }, { status: 400 });
      description = `${rest.item_description}${rest.quantity ? ` (${rest.quantity})` : ""}`;
      sendMaterialsEmail({ name, email, phone: phone || null, item_description: rest.item_description, quantity: rest.quantity ? Number(rest.quantity) : null, notes: notes || null }).catch(console.error);
      emailSent = true;
    } else if (type === "sponsor") {
      description = rest.description || "";
      sendSponsorEmail({ company_name: rest.company_name || null, contact_name: name, email, phone: phone || null, contribution_type: rest.contribution_type ?? "in_kind", amount: rest.amount ? Number(rest.amount) : null, description: rest.description || null }).catch(console.error);
      emailSent = true;
    }

    const { data: record, error: dbErr } = await supabase
      .from("contribution_signups")
      .insert({
        full_name:         name,
        email,
        phone:             phone || null,
        contribution_type: dbType,
        description,
        sponsorship_type:  rest.contribution_type || null,
        notes:             notes || null,
        status:            "pending",
      })
      .select("id")
      .single();

    if (dbErr) throw dbErr;

    if (emailSent) {
      await supabase.from("email_logs").insert({
        to_address: process.env.NOTIFY_EMAIL ?? "", subject: `Nieuwe bijdrage (${type}) — ${name}`,
        template: `contribution_${type}`, reference_id: record?.id, reference_type: "contribution_signup", status: "sent",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/bijdrage]", err);
    return NextResponse.json({ error: "Interne fout." }, { status: 500 });
  }
}
