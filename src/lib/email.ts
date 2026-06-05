// ─── E-mail via Resend ────────────────────────────────────────────────────────
//
// Benodigde ENV (zie .env.local.example):
//   RESEND_API_KEY   – verplicht (haal op via resend.com)
//   NOTIFY_EMAIL     – verplicht: ontvanger van organisatienotificaties
//   EMAIL_FROM       – optioneel, standaard: onboarding@resend.dev
//
// Documentatie: https://resend.com/docs

import { Resend } from "resend";

function getNotifyTo(): string {
  const addr = process.env.NOTIFY_EMAIL;
  if (!addr) console.warn("[email] NOTIFY_EMAIL niet ingesteld — organisatienotificaties worden NIET bezorgd.");
  return addr ?? "";
}

const FROM = process.env.EMAIL_FROM ?? "Autowasdag <onboarding@resend.dev>";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key || key.startsWith("re_VERVANG")) {
    console.warn("[email] RESEND_API_KEY niet ingesteld — e-mail wordt NIET verzonden.");
    return null;
  }
  return new Resend(key);
}

// ─── HTML-template ────────────────────────────────────────────────────────────

function row(label: string, value: string | null | undefined): string {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:8px 12px;font-weight:600;color:#155237;width:160px;vertical-align:top;border-bottom:1px solid #f0f0f0">${label}</td>
      <td style="padding:8px 12px;color:#333;vertical-align:top;border-bottom:1px solid #f0f0f0">${value}</td>
    </tr>`;
}

function buildHtml(opts: {
  typeLabel: string;
  accentColor: string;
  rows: [string, string | null | undefined][];
  timestamp: string;
}): string {
  const tableRows = opts.rows.map(([l, v]) => row(l, v)).join("");
  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f6f1;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08)">

    <!-- Header -->
    <div style="background:${opts.accentColor};padding:24px 28px">
      <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,.65);font-weight:600;text-transform:uppercase;letter-spacing:.1em">Nieuwe aanmelding</p>
      <h1 style="margin:0;font-size:22px;font-weight:800;color:#fff">${opts.typeLabel}</h1>
    </div>

    <!-- Data-tabel -->
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tbody>${tableRows}</tbody>
    </table>

    <!-- Footer -->
    <div style="padding:16px 28px;background:#f8f6f1;border-top:1px solid #eee">
      <p style="margin:0;font-size:12px;color:#999">
        Ontvangen op ${opts.timestamp} · Autowasdag Sionkerk Houten
      </p>
    </div>
  </div>
</body>
</html>`;
}

function now(): string {
  return new Date().toLocaleString("nl-NL", {
    timeZone: "Europe/Amsterdam",
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Verstuur-functies ────────────────────────────────────────────────────────

export type SendResult = { ok: true } | { ok: false; error: string };

async function send(subject: string, html: string): Promise<SendResult> {
  const resend = getResend();
  if (!resend) return { ok: true }; // stilte in dev als key ontbreekt

  const notifyTo = getNotifyTo();
  if (!notifyTo) return { ok: true };

  const { error } = await resend.emails.send({
    from: FROM,
    to:   notifyTo,
    subject,
    html,
  });

  if (error) {
    console.error("[email] Versturen mislukt:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// ── Autowas-reservering ──────────────────────────────────────────────────────

export async function sendReservationEmail(data: {
  name: string;
  email: string;
  phone: string | null;
  package: string;
  notes: string | null;
}): Promise<SendResult> {
  const packageLabels: Record<string, string> = {
    buiten_wassen: "Buiten wassen — €7,50",
    compleet:      "Compleet (buiten + binnen) — €12,50",
    basis:         "Basis (buitenwas)",
  };

  const html = buildHtml({
    typeLabel:    "Autowas-reservering",
    accentColor:  "#155237",
    rows: [
      ["Naam",         data.name],
      ["E-mail",       data.email],
      ["Telefoon",     data.phone],
      ["Pakket",       packageLabels[data.package] ?? data.package],
      ["Opmerkingen",  data.notes],
      ["Ingediend op", now()],
    ],
    timestamp: now(),
  });

  return send(`Nieuwe reservering — ${data.name}`, html);
}

// ── Bevestigingsmail naar bezoeker ───────────────────────────────────────────

export async function sendReservationConfirmation(data: {
  name: string;
  email: string;
  package: string;
  date: string;
  time: string;
}): Promise<SendResult> {
  const packageLabels: Record<string, string> = {
    buiten_wassen: "Buiten wassen",
    compleet:      "Compleet (buiten + binnen)",
  };

  function formatDate(dateStr: string): string {
    if (!dateStr) return dateStr;
    const [y, m, d] = dateStr.split("-").map(Number);
    const s = new Date(y, m - 1, d).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  const html = buildHtml({
    typeLabel:   "Uw reservering is bevestigd",
    accentColor: "#155237",
    rows: [
      ["Naam",        data.name],
      ["Pakket",      packageLabels[data.package] ?? data.package],
      ["Datum",       formatDate(data.date)],
      ["Tijdslot",    `${data.time} uur`],
      ["",            "Uw reservering is bevestigd. Kom 10 minuten voor het gekozen tijdslot naar de autowasdag. We zien u graag op zaterdag 11 juli."],
    ],
    timestamp: now(),
  });

  const resend = getResend();
  if (!resend) return { ok: true };

  const { error } = await resend.emails.send({
    from: FROM,
    to:   data.email,
    subject: `Bevestiging reservering Autowasdag — ${formatDate(data.date)} ${data.time}`,
    html,
  });

  if (error) {
    console.error("[email] Bevestiging mislukt:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

const TASK_LABELS: Record<string, string> = {
  wassen:     "Auto's wassen",
  koffie:     "Koffie schenken",
  friet:      "Friet & snacks",
  kinderhoek: "Kinderhoek",
  opbouwen:   "Op- en afbouwen",
  bakken:     "Iets bakken",
  spullen:    "Spullen meenemen",
  sponsoring: "Sponsoring / verkopen",
  anders:     "Iets anders",
  reserve:    "Reserve / oproepbaar",
  not_needed: "Niet nodig",
};

const AVAIL_LABELS: Record<string, string> = {
  full_day:  "Hele dag (09:00 – 16:00)",
  morning:   "Ochtend (09:00 – 12:30)",
  afternoon: "Middag (12:30 – 16:00)",
};

const SHIFT_LABELS: Record<string, string> = {
  not_chosen: "Nog niet gekozen",
  morning:    "Ochtend (09:00 – 12:30)",
  afternoon:  "Middag (12:30 – 16:00)",
  full_day:   "Hele dag (09:00 – 16:00)",
  specific:   "Specifieke tijd",
};

// ── Organisatiemail bij nieuwe vrijwilligersaanmelding ───────────────────────

const COST_LABELS: Record<string, string> = {
  eigen_kosten:       "Eigen kosten",
  vergoeding_gewenst: "Vergoeding gewenst",
  gesponsord:         "Gesponsord",
  weet_ik_nog_niet:   "Weet ik nog niet",
};

export async function sendVolunteerEmail(data: {
  name: string;
  email: string;
  phone: string | null;
  availability: string;
  tasks: string[];
  contribution_details: string | null;
  cost_preference: string | null;
  notes: string | null;
}): Promise<SendResult> {
  const html = buildHtml({
    typeLabel:    "Nieuwe vrijwilligersaanmelding Autowasdag",
    accentColor:  "#1a6644",
    rows: [
      ["Naam",                  data.name],
      ["E-mail",                data.email],
      ["Telefoon",              data.phone],
      ["Opgegeven voorkeuren",  data.tasks.map(t => TASK_LABELS[t] ?? t).join(", ") || "—"],
      ["Beschikbaarheid",       AVAIL_LABELS[data.availability] ?? data.availability],
      ["Extra informatie",      data.contribution_details],
      ["Kosten bakken",         data.cost_preference ? (COST_LABELS[data.cost_preference] ?? data.cost_preference) : null],
      ["Opmerking deelnemer",   data.notes],
      ["",                      "Let op: deze persoon is nog niet definitief ingepland. Deel deze persoon in via de vrijwilligersbackend."],
      ["Ingediend op",          now()],
    ],
    timestamp: now(),
  });

  return send(`Nieuwe vrijwilligersaanmelding — ${data.name}`, html);
}

// ── Bevestigingsmail naar vrijwilliger (direct na aanmelding) ────────────────

export async function sendVolunteerConfirmation(data: {
  name: string;
  email: string;
  availability: string;
  tasks: string[];
  contribution_details: string | null;
  cost_preference: string | null;
}): Promise<SendResult> {
  const html = buildHtml({
    typeLabel:   "Bedankt voor je aanmelding",
    accentColor: "#1a6644",
    rows: [
      ["Naam",                 data.name],
      ["Opgegeven voorkeuren", data.tasks.map(t => TASK_LABELS[t] ?? t).join(", ") || "—"],
      ["Beschikbaarheid",      AVAIL_LABELS[data.availability] ?? data.availability],
      ["Extra informatie",     data.contribution_details],
      ["Kosten bakken",        data.cost_preference ? (COST_LABELS[data.cost_preference] ?? data.cost_preference) : null],
      ["",                     "De organisatie maakt later de definitieve indeling. Je ontvangt nog bericht waar en wanneer je precies wordt ingepland."],
    ],
    timestamp: now(),
  });

  const resend = getResend();
  if (!resend) return { ok: true };

  const { error } = await resend.emails.send({
    from:    FROM,
    to:      data.email,
    subject: "Bedankt voor je aanmelding voor de Autowasdag",
    html,
  });

  if (error) {
    console.error("[email] Vrijwilliger bevestiging mislukt:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// ── Indelingsmail naar vrijwilliger ──────────────────────────────────────────

function buildAssignmentHtml(opts: {
  name: string;
  task_label: string;
  shift_label: string;
}): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f6f1;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08)">
    <div style="background:#155237;padding:24px 28px">
      <h1 style="margin:0;font-size:22px;font-weight:800;color:#fff">Autowasdag Sionkerk</h1>
    </div>
    <div style="padding:28px;font-size:15px;color:#222;line-height:1.7">
      <p style="margin:0 0 16px">Beste ${esc(opts.name)},</p>
      <p style="margin:0 0 20px">Bedankt voor je aanmelding voor de autowasdag.</p>
      <p style="margin:0 0 10px;font-weight:600;color:#155237">Je bent ingedeeld voor:</p>
      <table style="margin:0 0 24px;border-collapse:collapse">
        <tr>
          <td style="padding:4px 16px 4px 0;font-weight:600;color:#444;white-space:nowrap;vertical-align:top">Taak</td>
          <td style="padding:4px 0;color:#222">${esc(opts.task_label)}</td>
        </tr>
        <tr>
          <td style="padding:4px 16px 4px 0;font-weight:600;color:#444;white-space:nowrap;vertical-align:top">Tijd/dagdeel</td>
          <td style="padding:4px 0;color:#222">${esc(opts.shift_label)}</td>
        </tr>
      </table>
      <p style="margin:0 0 10px;font-weight:600;color:#155237">Praktische informatie:</p>
      <ul style="margin:0 0 28px;padding-left:20px;color:#333">
        <li style="margin-bottom:6px">Meld je bij aankomst bij de organisatie.</li>
        <li style="margin-bottom:6px">Neem mee wat je hebt opgegeven, als dat van toepassing is.</li>
        <li style="margin-bottom:6px">Kun je toch niet? Laat het dan zo snel mogelijk weten.</li>
      </ul>
      <p style="margin:0 0 4px;color:#333">Hartelijke groet,</p>
      <p style="margin:0;font-weight:600;color:#155237">Organisatie autowasdag Sionkerk</p>
    </div>
    <div style="padding:16px 28px;background:#f8f6f1;border-top:1px solid #eee">
      <p style="margin:0;font-size:12px;color:#999">Autowasdag Sionkerk Houten</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendAssignmentEmail(data: {
  name: string;
  email: string;
  final_tasks: string[];
  final_shift: string;
  final_start_time: string | null;
  final_end_time: string | null;
  contribution_details: string | null;
  cost_preference: string | null;
  event_date_formatted?: string | null;
}): Promise<SendResult> {
  const taskLabel = data.final_tasks.map(t => TASK_LABELS[t] ?? t).join(", ") || "—";

  let shiftLabel = SHIFT_LABELS[data.final_shift] ?? data.final_shift;
  if (data.final_shift === "specific" && data.final_start_time && data.final_end_time) {
    shiftLabel = `Van ${data.final_start_time.slice(0, 5)} tot ${data.final_end_time.slice(0, 5)}`;
  }

  const html = buildAssignmentHtml({ name: data.name, task_label: taskLabel, shift_label: shiftLabel });

  const resend = getResend();
  if (!resend) {
    console.error("[email] RESEND_API_KEY niet ingesteld — indelingsmail voor", data.email, "niet verzonden.");
    return { ok: false, error: "RESEND_API_KEY is niet ingesteld." };
  }

  const { error } = await resend.emails.send({
    from:    FROM,
    to:      data.email,
    subject: "Je indeling voor de Autowasdag",
    html,
  });

  if (error) {
    console.error("[email] Indelingsmail mislukt voor", data.email, ":", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// ── Gebak-bijdrage ────────────────────────────────────────────────────────────

export async function sendBakingEmail(data: {
  name: string;
  email: string;
  phone: string | null;
  item_description: string;
  quantity: number;
  dietary_info: string | null;
  notes: string | null;
}): Promise<SendResult> {
  const html = buildHtml({
    typeLabel:    "Gebakbijdrage",
    accentColor:  "#b45309",
    rows: [
      ["Naam",         data.name],
      ["E-mail",       data.email],
      ["Telefoon",     data.phone],
      ["Wat",          data.item_description],
      ["Aantal",       String(data.quantity)],
      ["Dieetwensen",  data.dietary_info],
      ["Opmerkingen",  data.notes],
      ["Ingediend op", now()],
    ],
    timestamp: now(),
  });

  return send(`Nieuwe gebakbijdrage — ${data.name}`, html);
}

// ── Materiaal-bijdrage ────────────────────────────────────────────────────────

export async function sendMaterialsEmail(data: {
  name: string;
  email: string;
  phone: string | null;
  item_description: string;
  quantity: number | null;
  notes: string | null;
}): Promise<SendResult> {
  const html = buildHtml({
    typeLabel:    "Spullen meenemen",
    accentColor:  "#92400e",
    rows: [
      ["Naam",         data.name],
      ["E-mail",       data.email],
      ["Telefoon",     data.phone],
      ["Wat",          data.item_description],
      ["Hoeveel",      data.quantity ? String(data.quantity) : null],
      ["Opmerkingen",  data.notes],
      ["Ingediend op", now()],
    ],
    timestamp: now(),
  });

  return send(`Nieuwe spullen-bijdrage — ${data.name}`, html);
}

// ── Sponsor-bijdrage ──────────────────────────────────────────────────────────

export async function sendSponsorEmail(data: {
  company_name: string | null;
  contact_name: string;
  email: string;
  phone: string | null;
  contribution_type: string;
  amount: number | null;
  description: string | null;
}): Promise<SendResult> {
  const typeLabels: Record<string, string> = {
    financial: "Financieel",
    in_kind:   "In natura",
    services:  "Diensten",
  };

  const html = buildHtml({
    typeLabel:    "Sponsoring / verkopen",
    accentColor:  "#0f766e",
    rows: [
      ["Contactpersoon", data.contact_name],
      ["Organisatie",    data.company_name],
      ["E-mail",         data.email],
      ["Telefoon",       data.phone],
      ["Type bijdrage",  typeLabels[data.contribution_type] ?? data.contribution_type],
      ["Bedrag",         data.amount ? `€${data.amount}` : null],
      ["Omschrijving",   data.description],
      ["Ingediend op",   now()],
    ],
    timestamp: now(),
  });

  return send(`Nieuwe sponsorbijdrage — ${data.contact_name}`, html);
}
