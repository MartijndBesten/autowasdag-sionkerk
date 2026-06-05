import { NextResponse } from "next/server";

// Tijdelijk debug-eindpunt — verwijder na diagnose
// /api/debug/email?token=DEBUG2026

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (token !== "DEBUG2026") {
    return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  }

  const apiKey = process.env.RESEND_API_KEY ?? "";
  const from   = process.env.EMAIL_FROM ?? "(niet ingesteld)";

  // Toon laatste 6 tekens van de key (veilig)
  const keyTail = apiKey.length >= 6 ? apiKey.slice(-6) : "(te kort)";
  const keyHead = apiKey.length >= 10 ? apiKey.slice(0, 10) + "…" : apiKey;

  // Bevraag de Resend API: welke domeinen zijn geregistreerd in DEZE workspace?
  let domains: unknown = null;
  let domainsError: unknown = null;
  try {
    const domRes = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });
    if (domRes.ok) {
      domains = await domRes.json();
    } else {
      const txt = await domRes.text();
      domainsError = { status: domRes.status, body: txt };
    }
  } catch (e) {
    domainsError = String(e);
  }

  // Stuur een testmail naar NOTIFY_EMAIL en registreer de exacte Resend response
  let sendResult: unknown = null;
  try {
    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to:      process.env.NOTIFY_EMAIL ?? "test@example.com",
        subject: "[DEBUG] Resend key-check autowasdagsionkerk.nl",
        html:    "<p>Debug-test. Kan worden genegeerd.</p>",
      }),
    });
    const sendBody = await sendRes.json();
    sendResult = { status: sendRes.status, body: sendBody };
  } catch (e) {
    sendResult = { exception: String(e) };
  }

  return NextResponse.json({
    key_last6:    keyTail,
    key_preview:  keyHead,
    EMAIL_FROM:   from,
    NOTIFY_EMAIL: process.env.NOTIFY_EMAIL ?? "(niet ingesteld)",
    domains_in_workspace: domains,
    domains_error:        domainsError,
    send_test:            sendResult,
    timestamp:            new Date().toISOString(),
  });
}
