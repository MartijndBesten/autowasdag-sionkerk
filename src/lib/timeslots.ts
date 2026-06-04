import type { PackageType } from "./supabase/types";

export const SLOT_DURATION = 20; // minuten
export const PACKAGE_SLOTS: Record<PackageType, number> = {
  buiten_wassen: 1,
  compleet:      2,
};

// Genereer alle mogelijke tijdsloten tussen start en eind
export function generateSlots(
  startTime: string = "09:00",
  endTime:   string = "16:00",
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

// Geeft de tijdsloten die een pakket nodig heeft
export function requiredSlots(startTime: string, pkg: PackageType, allSlots: string[]): string[] {
  const count = PACKAGE_SLOTS[pkg];
  const idx   = slotIndex(startTime, allSlots);
  if (idx === -1) return [];
  return allSlots.slice(idx, idx + count);
}

// Formaatteer een slot voor weergave
export function formatSlot(time: string): string {
  const [h, m] = time.split(":");
  return `${h}:${m} uur`;
}

// Bereken eindtijd van een pakket
export function endTime(startTime: string, pkg: PackageType): string {
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + PACKAGE_SLOTS[pkg] * SLOT_DURATION;
  const eh = Math.floor(total / 60).toString().padStart(2, "0");
  const em = (total % 60).toString().padStart(2, "0");
  return `${eh}:${em}`;
}

// Type voor beschikbaar slot (terugkomend van API)
export interface AvailableSlot {
  time: string;
  label: string;
  available: boolean;
  availableBays: number;
}

// Filter slots die beschikbaar zijn voor een compleet pakket
// (slot + volgend slot moeten allebei vrij zijn)
export function filterSlotsForPackage(
  slots: AvailableSlot[],
  pkg: PackageType,
  washBays: number
): AvailableSlot[] {
  if (pkg !== "compleet") return slots.filter(s => s.availableBays > 0);

  return slots.filter((slot, idx) => {
    const next = slots[idx + 1];
    return slot.availableBays >= 1 && next && next.availableBays >= 1;
  });
}
