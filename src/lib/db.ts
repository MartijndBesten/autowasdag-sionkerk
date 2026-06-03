// ─── Database abstraction layer ───────────────────────────────────────────────
//
// All functions return { data, error } — same shape as Supabase responses.
// To connect Supabase: replace each function body with:
//   return supabase.from('<table>').insert(input).select().single()
//
// Local state simulation is used until then.

import type {
  CarReservation,
  CarReservationInput,
  Volunteer,
  VolunteerInput,
  BakingContribution,
  BakingContributionInput,
  SponsorContribution,
  SponsorContributionInput,
  MaterialContribution,
  MaterialContributionInput,
} from "./types";

type DbResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

// Simulates an async insert with a small network-like delay
async function localInsert<T>(
  table: string,
  input: object
): Promise<DbResult<T>> {
  await new Promise((r) => setTimeout(r, 600));
  const record = {
    ...input,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    status: "pending",
  } as T;
  if (process.env.NODE_ENV !== "production") {
    console.log(`[db:dev] Simulated INSERT ${table}`);
  }
  return { data: record, error: null };
}

// ─── car_reservations ────────────────────────────────────────────────────────
export async function createCarReservation(
  input: CarReservationInput
): Promise<DbResult<CarReservation>> {
  // TODO: return supabase.from("car_reservations").insert(input).select().single()
  return localInsert("car_reservations", input);
}

// ─── volunteers ──────────────────────────────────────────────────────────────
export async function createVolunteer(
  input: VolunteerInput
): Promise<DbResult<Volunteer>> {
  // TODO: return supabase.from("volunteers").insert(input).select().single()
  return localInsert("volunteers", input);
}

// ─── baking_contributions ────────────────────────────────────────────────────
export async function createBakingContribution(
  input: BakingContributionInput
): Promise<DbResult<BakingContribution>> {
  // TODO: return supabase.from("baking_contributions").insert(input).select().single()
  return localInsert("baking_contributions", input);
}

// ─── sponsor_contributions ───────────────────────────────────────────────────
export async function createSponsorContribution(
  input: SponsorContributionInput
): Promise<DbResult<SponsorContribution>> {
  // TODO: return supabase.from("sponsor_contributions").insert(input).select().single()
  return localInsert("sponsor_contributions", input);
}

// ─── material_contributions ──────────────────────────────────────────────────
export async function createMaterialContribution(
  input: MaterialContributionInput
): Promise<DbResult<MaterialContribution>> {
  // TODO: return supabase.from("material_contributions").insert(input).select().single()
  return localInsert("material_contributions", input);
}
