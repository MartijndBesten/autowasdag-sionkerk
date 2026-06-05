import { NextResponse } from "next/server";
import { Resend } from "resend";

// Tijdelijk debug-eindpunt — verwijder na diagnose
// Beschermd via simpele token in query string: /api/debug/email?token=DEBUG2026

export async function GET(req: Request) {
  const url  = new URL(req.url);
  const token = url.searchParams.get("token");
  if (token !== "DEBUG2026") {
    return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  }

  const from    = process.env.EMAIL_FROM ?? "(niet ingesteld — fallback: onboarding@resend.dev)";
  const notify  = process.env.NOTIFY_EMAIL ?? "(niet ingesteld)";
  const apiKey  = process.env.RESEND_API_KEY;
  const keyInfo = !apiKey
    ? "NIET INGESTELD"
    : apiKey.startsWith("re_VERVANG")
      ? "Placeholder waarde (re_VERVANG…)"
      : `Ingesteld (${apiKey.slice(0,10)}…)`;

  // Test Resend-verbinding zonder echte mail
  let resendTest: Record<string, unknown> = {};
  if (apiKey && !apiKey.startsWith("re_VERVANG")) {
    try {
      const resend = new Resend(apiKey);
      // Stuur een echte testmail naar notify adres zodat we de response zien
      const { data, error } = await resend.emails.send({
        from:    process.env.EMAIL_FROM ?? "Autowasdag <onboarding@resend.dev>",
        to:      process.env.NOTIFY_EMAIL ?? "ontvanger@ontbreekt.nl",
        subject: "[DEBUG] Resend verbindingstest autowasdagsionkerk.nl",
        html:    "<p>Dit is een automatische verbindingstest. Kan worden genegeerd.</p>",
      });
      resendTest = {
        send_data:  data,
        send_error: error,
        accepted:   !error,
      };
    } catch (e) {
      resendTest = { exception: String(e) };
    }
  } else {
    resendTest = { skipped: "RESEND_API_KEY niet bruikbaar" };
  }

  return NextResponse.json({
    EMAIL_FROM:    from,
    NOTIFY_EMAIL:  notify,
    RESEND_KEY:    keyInfo,
    resend_test:   resendTest,
    timestamp:     new Date().toISOString(),
  });
}
