"use client";

import { useState } from "react";
import Link from "next/link";

const AMOUNT_OPTIONS = [
  { value: "5",     label: "€5" },
  { value: "10",    label: "€10" },
  { value: "25",    label: "€25" },
  { value: "anders",label: "Eigen bedrag" },
];

const fieldCls  = "w-full border border-stone-200 bg-white rounded-xl px-4 py-3 text-sm text-green-950 placeholder-gray-300 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors";
const labelCls  = "block text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1.5";
const reqStar   = <span className="text-red-400 ml-0.5">*</span>;

export default function BijdragenForm() {
  const [form,        setForm]        = useState({ name: "", email: "", phone: "", notes: "" });
  const [amount,      setAmount]      = useState<string>("");
  const [customAmount,setCustomAmount]= useState("");
  const [status,      setStatus]      = useState<"idle"|"loading"|"success"|"error">("idle");
  const [errorMsg,    setErrorMsg]    = useState("");

  function set(k: keyof typeof form, v: string) { setForm(p => ({ ...p, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) { setErrorMsg("Kies een bedrag."); return; }
    if (amount === "anders" && (!customAmount || parseFloat(customAmount.replace(",",".")) <= 0)) {
      setErrorMsg("Voer een geldig eigen bedrag in.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/bijdragen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:          form.name,
          email:         form.email,
          phone:         form.phone || null,
          amount,
          custom_amount: customAmount,
          notes:         form.notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Fout");
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Er is iets misgegaan. Probeer het opnieuw.");
      setStatus("error");
    }
  }

  if (status === "success") {
    const amountLabel = amount === "anders"
      ? `€${parseFloat(customAmount.replace(",",".")).toFixed(2).replace(".",",")}`
      : `€${amount}`;
    return (
      <div className="text-center py-10 space-y-4">
        <div className="text-5xl mb-2">💜</div>
        <h2 className="text-2xl font-bold text-green-950">Hartelijk dank, {form.name}!</h2>
        <p className="text-gray-500 leading-relaxed max-w-sm mx-auto">
          Uw bijdrage van <strong>{amountLabel}</strong> is ontvangen.
          U ontvangt een bevestiging op <strong>{form.email}</strong>.
        </p>
        <p className="text-gray-400 text-sm max-w-xs mx-auto">
          Betaling is mogelijk op de dag zelf — contant of via QR-code.
          De opbrengst gaat naar het opknappen van de zalen van de Sionkerk.
        </p>
        <Link href="/" className="inline-block mt-4 bg-green-800 text-white font-semibold px-6 py-3 rounded-full hover:bg-green-900 transition-colors text-sm">
          Terug naar de homepage
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Bedrag */}
      <div>
        <label className={labelCls}>Bijdragebedrag {reqStar}</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
          {AMOUNT_OPTIONS.map(opt => (
            <button key={opt.value} type="button"
              onClick={() => setAmount(opt.value)}
              className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-colors ${
                amount === opt.value
                  ? "border-purple-600 bg-purple-50 text-purple-800"
                  : "border-stone-200 text-gray-600 hover:border-purple-300"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
        {amount === "anders" && (
          <div className="mt-3">
            <label className={labelCls}>Eigen bedrag (€) {reqStar}</label>
            <input
              type="number" min="1" step="0.01"
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
              placeholder="bijv. 15"
              className={fieldCls}
            />
          </div>
        )}
      </div>

      {/* Persoonsgegevens */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelCls}>Naam {reqStar}</label>
          <input type="text" required value={form.name} onChange={e => set("name", e.target.value)}
            placeholder="Uw naam" className={fieldCls} />
        </div>
        <div>
          <label className={labelCls}>E-mailadres {reqStar}</label>
          <input type="email" required value={form.email} onChange={e => set("email", e.target.value)}
            placeholder="uw@email.nl" className={fieldCls} />
        </div>
        <div>
          <label className={labelCls}>Telefoon <span className="text-gray-300 font-normal normal-case tracking-normal">(optioneel)</span></label>
          <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
            placeholder="06 00 00 00 00" className={fieldCls} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Persoonlijk bericht <span className="text-gray-300 font-normal normal-case tracking-normal">(optioneel)</span></label>
          <textarea rows={3} value={form.notes} onChange={e => set("notes", e.target.value)}
            placeholder="Een berichtje of groet aan de jongeren van de Sionkerk…"
            className={`${fieldCls} resize-none`} />
        </div>
      </div>

      {errorMsg && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2">{errorMsg}</p>
      )}

      <button type="submit"
        disabled={status === "loading" || !form.name || !form.email || !amount}
        className="w-full bg-purple-700 text-white font-semibold text-base rounded-full py-4 hover:bg-purple-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {status === "loading"
          ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Bezig…</>
          : "Bijdrage bevestigen →"}
      </button>

      <p className="text-center text-gray-400 text-xs">
        Betaling vindt plaats op de dag zelf — contant of via QR-code. Er wordt niets vooraf afgeschreven.
      </p>
    </form>
  );
}
