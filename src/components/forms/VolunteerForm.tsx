"use client";

import { useState } from "react";
import { useModal } from "@/context/ModalContext";

const TASKS = [
  { id: "wassen",     label: "Auto's wassen" },
  { id: "koffie",     label: "Koffie & gebak" },
  { id: "friet",      label: "Friet & snacks" },
  { id: "kinderhoek", label: "Kinderhoek" },
  { id: "opbouwen",   label: "Organisatie / op- en afbouwen" },
];

const AVAILABILITY = [
  { value: "full_day",  label: "Hele dag",  sub: "09:00 – 16:00" },
  { value: "morning",   label: "Ochtend",   sub: "09:00 – 12:30" },
  { value: "afternoon", label: "Middag",    sub: "12:30 – 16:00" },
];

export default function VolunteerForm() {
  const { closeModal } = useModal();
  const [form, setForm] = useState({ name: "", email: "", phone: "", availability: "full_day", notes: "" });
  const [tasks, setTasks]   = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function set(k: keyof typeof form, v: string) { setForm(p => ({ ...p, [k]: v })); }
  function toggleTask(id: string) { setTasks(p => p.includes(id) ? p.filter(t => t !== id) : [...p, id]); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/aanmelden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone || null,
          availability: form.availability, tasks, notes: form.notes || null,
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

  if (status === "success") return (
    <div className="py-8 text-center">
      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="font-bold text-green-950 text-lg mb-2">Bedankt, {form.name}!</h3>
      <p className="text-gray-500 text-sm leading-relaxed">We nemen contact op met meer informatie over de dag.</p>
      <button onClick={closeModal} className="btn-primary mt-6">Sluiten</button>
    </div>
  );

  const f  = "w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-green-950 placeholder-gray-300 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors";
  const lb = "block text-xs font-semibold text-green-700 uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-gray-400 text-sm">Fijn dat je mee wilt helpen!</p>

      <div><label className={lb}>Naam <span className="text-red-400">*</span></label>
        <input required value={form.name} onChange={e => set("name", e.target.value)} placeholder="Je volledige naam" className={f} /></div>

      <div><label className={lb}>E-mailadres <span className="text-red-400">*</span></label>
        <input type="email" required value={form.email} onChange={e => set("email", e.target.value)} placeholder="jouw@email.nl" className={f} /></div>

      <div><label className={lb}>Telefoon <span className="text-gray-300 font-normal">(optioneel)</span></label>
        <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="06 00 00 00 00" className={f} /></div>

      <div>
        <label className={lb}>Beschikbaarheid <span className="text-red-400">*</span></label>
        <div className="grid grid-cols-3 gap-2">
          {AVAILABILITY.map(opt => (
            <label key={opt.value} className={`cursor-pointer rounded-xl border-2 px-3 py-3 text-center transition-colors ${form.availability === opt.value ? "border-green-700 bg-green-50" : "border-stone-200 hover:border-green-300"}`}>
              <input type="radio" name="availability" value={opt.value} checked={form.availability === opt.value}
                onChange={() => set("availability", opt.value)} className="sr-only" />
              <span className={`block text-xs font-semibold ${form.availability === opt.value ? "text-green-800" : "text-gray-600"}`}>{opt.label}</span>
              <span className="block text-[10px] text-gray-400 mt-0.5">{opt.sub}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className={lb}>Voorkeurstaken <span className="text-gray-300 font-normal">(optioneel)</span></label>
        <div className="space-y-2">
          {TASKS.map(task => (
            <label key={task.id} className="flex items-center gap-3 cursor-pointer group">
              <div onClick={() => toggleTask(task.id)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${tasks.includes(task.id) ? "bg-green-700 border-green-700" : "border-stone-300 group-hover:border-green-400"}`}>
                {tasks.includes(task.id) && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-600">{task.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div><label className={lb}>Opmerkingen <span className="text-gray-300 font-normal">(optioneel)</span></label>
        <textarea rows={3} value={form.notes} onChange={e => set("notes", e.target.value)}
          placeholder="Iets wat we moeten weten?" className={`${f} resize-none`} /></div>

      {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

      <button type="submit" disabled={status === "loading"} className="btn-primary w-full justify-center flex items-center gap-2">
        {status === "loading"
          ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Bezig…</>
          : "Aanmelden als vrijwilliger"}
      </button>
    </form>
  );
}
