"use client";

import { useState } from "react";
import type { PackageType } from "@/lib/types";
import { useModal } from "@/context/ModalContext";

const packageLabels: Record<PackageType, string> = {
  buiten_wassen: "Buiten wassen — €7,50",
  compleet:      "Compleet — €12,50",
};

export default function ReservationForm() {
  const { modalData, closeModal } = useModal();

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    package: (modalData.package as PackageType) ?? "compleet",
    notes: "",
  });
  const [status, setStatus]   = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function set(k: keyof typeof form, v: string) { setForm(p => ({ ...p, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/reserveren", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name:        form.name,
          email:            form.email,
          phone:            form.phone || null,
          package_type:     form.package,
          reservation_date: "",
          reservation_time: "",
          notes:            form.notes || null,
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

  const field = "w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-green-950 placeholder-gray-300 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors";
  const lbl   = "block text-xs font-semibold text-green-700 uppercase tracking-wider mb-1.5";

  if (status === "success") return (
    <div className="py-8 text-center">
      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="font-bold text-green-950 text-lg mb-2">Aanmelding ontvangen!</h3>
      <p className="text-gray-500 text-sm leading-relaxed">
        Bedankt, {form.name}. We nemen contact op ter bevestiging.
        Tot de Autowasdag!
      </p>
      <button onClick={closeModal} className="btn-primary mt-6">Sluiten</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-gray-400 text-sm">Vul je gegevens in en kies je pakket. Betaling ter plaatse.</p>
      <div>
        <label className={lbl}>Naam <span className="text-red-400">*</span></label>
        <input required value={form.name} onChange={e => set("name", e.target.value)}
          placeholder="Je volledige naam" className={field} />
      </div>
      <div>
        <label className={lbl}>E-mailadres <span className="text-red-400">*</span></label>
        <input type="email" required value={form.email} onChange={e => set("email", e.target.value)}
          placeholder="jouw@email.nl" className={field} />
      </div>
      <div>
        <label className={lbl}>Telefoonnummer <span className="text-gray-300 font-normal">(optioneel)</span></label>
        <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
          placeholder="06 00 00 00 00" className={field} />
      </div>
      <div>
        <label className={lbl}>Pakket <span className="text-red-400">*</span></label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(packageLabels) as [PackageType, string][]).map(([value, label]) => (
            <label key={value} className={`cursor-pointer rounded-xl border-2 px-3 py-3 text-center text-xs font-semibold transition-colors ${form.package === value ? "border-green-700 bg-green-50 text-green-800" : "border-stone-200 text-gray-500 hover:border-green-300"}`}>
              <input type="radio" name="package" value={value} checked={form.package === value}
                onChange={() => set("package", value)} className="sr-only" />
              {label}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className={lbl}>Opmerkingen <span className="text-gray-300 font-normal">(optioneel)</span></label>
        <textarea rows={3} value={form.notes} onChange={e => set("notes", e.target.value)}
          placeholder="Bijzonderheden, een vraag, etc." className={`${field} resize-none`} />
      </div>
      {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
      <button type="submit" disabled={status === "loading"}
        className="btn-primary w-full justify-center flex items-center gap-2">
        {status === "loading"
          ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Bezig…</>
          : "Reserveer nu →"}
      </button>
      <p className="text-xs text-center text-gray-400">☕ Gratis koffie bij je reservering · gebak en lekkernijen verkrijgbaar op de dag</p>
    </form>
  );
}
