"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { PackageType } from "@/lib/supabase/types";
import type { AvailableSlot } from "@/lib/timeslots";
import { formatEventDate } from "@/lib/event";

const PACKAGE_OPTIONS: { value: PackageType; label: string; duration: string; price: string }[] = [
  { value: "buiten_wassen", label: "Buitenkant wassen",          duration: "± 20 min", price: "€7,50" },
  { value: "compleet",      label: "Compleet (buiten + binnen)", duration: "± 40 min", price: "€12,50" },
];

export default function ReserverenPageForm({ eventDate }: { eventDate: string }) {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [form, setForm] = useState({
    full_name:        "",
    email:            "",
    phone:            "",
    license_plate:    "",
    package_type:     (searchParams.get("pakket") as PackageType) ?? "compleet",
    reservation_date: eventDate,
    reservation_time: "",
    extra_donation:   "",
    notes:            "",
  });
  const [slots,      setSlots]   = useState<AvailableSlot[]>([]);
  const [loadSlots,  setLoadSlots] = useState(false);
  const [status,     setStatus]  = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg,   setErrorMsg] = useState("");

  function set(k: keyof typeof form, v: string) {
    setForm(p => ({ ...p, [k]: v }));
    if (k === "package_type") setForm(p => ({ ...p, package_type: v as PackageType, reservation_time: "" }));
  }

  const fetchSlots = useCallback(async () => {
    if (!form.reservation_date || !form.package_type) return;
    setLoadSlots(true);
    try {
      const res = await fetch(`/api/timeslots?date=${form.reservation_date}&package=${form.package_type}`);
      const json = await res.json();
      setSlots(json.slots ?? []);
    } catch { setSlots([]); }
    setLoadSlots(false);
  }, [form.reservation_date, form.package_type]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.reservation_time) { setErrorMsg("Kies een tijdslot."); return; }
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/reserveren", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name:        form.full_name,
          email:            form.email,
          phone:            form.phone     || null,
          license_plate:    form.license_plate || null,
          package_type:     form.package_type,
          reservation_date: form.reservation_date,
          reservation_time: form.reservation_time,
          extra_donation:   form.extra_donation ? Number(form.extra_donation) : 0,
          notes:            form.notes    || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Fout");
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Er is iets misgegaan.");
      setStatus("error");
    }
  }

  const fc  = "w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-green-950 placeholder-gray-300 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors";
  const lbl = "block text-xs font-semibold text-green-700 uppercase tracking-wider mb-1.5";

  if (status === "success") return (
    <div className="py-10 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
        <svg className="w-8 h-8 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="font-bold text-green-950 text-2xl mb-3">Reservering bevestigd!</h2>
      <p className="text-gray-500 mb-2">Bedankt, <strong>{form.full_name}</strong>.</p>
      <p className="text-gray-400 text-sm max-w-sm mx-auto">
        Uw reservering is bevestigd. U bent ingeschreven voor keuze{" "}
        <strong>{PACKAGE_OPTIONS.find(p => p.value === form.package_type)?.label}</strong>{" "}
        op <strong>{formatEventDate(form.reservation_date)}</strong> om <strong>{form.reservation_time}</strong>.
        Kom 10 minuten voor het gekozen tijdslot naar de autowasdag. We zien u graag op zaterdag 11 juli.
        U ontvangt hiervan een bevestiging per e-mail.
      </p>
      <button onClick={() => router.push("/")} className="btn-primary mt-8">Terug naar de homepage</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Pakket */}
      <div>
        <label className={lbl}>Pakket <span className="text-red-400">*</span></label>
        <div className="space-y-2">
          {PACKAGE_OPTIONS.map(p => (
            <label key={p.value} className={`flex items-center justify-between gap-3 cursor-pointer rounded-xl border-2 px-4 py-3 transition-colors ${form.package_type === p.value ? "border-green-700 bg-green-50" : "border-stone-200 hover:border-green-300"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${form.package_type === p.value ? "border-green-700" : "border-stone-300"}`}>
                  {form.package_type === p.value && <div className="w-2 h-2 rounded-full bg-green-700" />}
                </div>
                <input type="radio" name="package" value={p.value} checked={form.package_type === p.value}
                  onChange={() => set("package_type", p.value)} className="sr-only" />
                <span className={`text-sm font-medium ${form.package_type === p.value ? "text-green-800" : "text-gray-600"}`}>{p.label}</span>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{p.price} · {p.duration}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Datum */}
      <div>
        <label className={lbl}>Datum</label>
        <div className="border border-stone-200 rounded-xl px-4 py-3 bg-gray-50">
          <p className="text-sm font-medium text-green-950">{formatEventDate(eventDate)}</p>
          <p className="text-xs text-gray-400 mt-0.5">De Autowasdag vindt op één dag plaats</p>
        </div>
      </div>

      {/* Tijdslot */}
      <div>
        <label className={lbl}>Tijdslot <span className="text-red-400">*</span></label>
        {loadSlots ? (
          <p className="text-sm text-gray-400">Beschikbare tijden laden…</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
            Geen tijdsloten beschikbaar voor dit pakket. Probeer een ander pakket.
          </p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {slots.map(slot => (
              <label key={slot.time} className={`cursor-pointer text-center rounded-xl border-2 py-2.5 text-xs font-semibold transition-colors ${
                form.reservation_time === slot.time
                  ? "border-green-700 bg-green-50 text-green-800"
                  : "border-stone-200 text-gray-600 hover:border-green-300"
              }`}>
                <input type="radio" name="time" value={slot.time} checked={form.reservation_time === slot.time}
                  onChange={() => set("reservation_time", slot.time)} className="sr-only" />
                {slot.time}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Persoonsgegevens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={lbl}>Naam <span className="text-red-400">*</span></label>
          <input required value={form.full_name} onChange={e => set("full_name", e.target.value)}
            placeholder="Je volledige naam" className={fc} />
        </div>
        <div>
          <label className={lbl}>E-mailadres <span className="text-red-400">*</span></label>
          <input type="email" required value={form.email} onChange={e => set("email", e.target.value)}
            placeholder="jouw@email.nl" className={fc} />
        </div>
        <div>
          <label className={lbl}>Telefoonnummer <span className="text-gray-300 font-normal">(optioneel)</span></label>
          <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
            placeholder="06 00 00 00 00" className={fc} />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Kenteken <span className="text-gray-300 font-normal">(optioneel maar handig)</span></label>
          <input value={form.license_plate} onChange={e => set("license_plate", e.target.value.toUpperCase())}
            placeholder="bijv. AB-123-C" className={`${fc} uppercase`} />
        </div>
      </div>

      {/* Extra donatie */}
      <div>
        <label className={lbl}>Extra donatie <span className="text-gray-300 font-normal">(optioneel)</span></label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
          <input type="number" min="0" step="0.50" value={form.extra_donation}
            onChange={e => set("extra_donation", e.target.value)}
            placeholder="0" className={`${fc} pl-8`} />
        </div>
        <p className="text-xs text-gray-400 mt-1">Wilt u meer bijdragen? Elke extra euro is welkom.</p>
      </div>

      {/* Opmerkingen */}
      <div>
        <label className={lbl}>Opmerkingen <span className="text-gray-300 font-normal">(optioneel)</span></label>
        <textarea rows={3} value={form.notes} onChange={e => set("notes", e.target.value)}
          placeholder="Bijzonderheden over je auto, een vraag, etc." className={`${fc} resize-none`} />
      </div>

      {errorMsg && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2">{errorMsg}</p>}

      <button type="submit" disabled={status === "loading" || !form.reservation_time}
        className="btn-primary w-full justify-center flex items-center gap-2 py-4 text-base disabled:opacity-50">
        {status === "loading"
          ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Bezig…</>
          : "Reservering plaatsen"}
      </button>
    </form>
  );
}
