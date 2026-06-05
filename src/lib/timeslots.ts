import type { PackageType } from "./supabase/types";

export const SLOT_DURATION = 20; // standaard slotduur in minuten (raster)

// Hoeveel raster-slots een pakket nodig heeft
export function computeSlotsNeeded(durationMin: number, slotDurationMin: number): number {
  return Math.max(1, Math.ceil(durationMin / slotDurationMin));
}

// Backward compat — gebruik computeSlotsNeeded waar mogelijk
export const PACKAGE_SLOTS: Record<PackageType, number> = {
  buiten_wassen: 1,
  compleet:      2,
};

// Genereer alle mogelijke tijdsloten tussen start en eind
export function generateSlots(
  startTime:   string = "09:00",
  endTime:     string = "16:00",
  intervalMin: number = SLOT_DURATION
): string[] {
  const slots: string[] = [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let cur = sh * 60 + sm;
  const end = eh * 60 + em;
  while (cur < end) {
    const h = Math.floor(cur / 60).toString().padStart(2, "0");
    const m = (cur % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    cur += intervalMin;
  }
  return slots;
}

// Geeft index van een tijdstip in de slot-array
export function slotIndex(time: string, slots: string[]): number {
  return slots.indexOf(time);
}

// Geeft de tijdsloten die een reservering nodig heeft
export function requiredSlots(startTime: string, slotsNeeded: number, allSlots: string[]): string[] {
  const idx = slotIndex(startTime, allSlots);
  if (idx === -1) return [];
  return allSlots.slice(idx, idx + slotsNeeded);
}

// Formaatteer een slot voor weergave
export function formatSlot(time: string): string {
  const [h, m] = time.split(":");
  return `${h}:${m} uur`;
}

// Bereken eindtijd op basis van starttijd en duur in minuten
export function calcEndTime(startTime: string, durationMin: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total  = h * 60 + m + durationMin;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

// Type voor beschikbaar slot (terugkomend van API)
export interface AvailableSlot {
  time: string;
  label: string;
  available: boolean;
  availableBays: number;
}

// Filter slots die beschikbaar zijn voor een pakket met N opeenvolgende slots nodig
export function filterSlotsForPackage(
  slots:       AvailableSlot[],
  slotsNeeded: number,
  washBays:    number
): AvailableSlot[] {
  if (slotsNeeded <= 1) {
    return slots.filter(s => s.availableBays > 0);
  }
  return slots.filter((slot, idx) => {
    for (let i = 0; i < slotsNeeded; i++) {
      const s = slots[idx + i];
      if (!s || s.availableBays < 1) return false;
    }
    return true;
  });
}
