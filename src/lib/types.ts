// ─── Shared enums ────────────────────────────────────────────────────────────

export type PackageType = "buiten_wassen" | "compleet";
export type AvailabilityType = "full_day" | "morning" | "afternoon";
export type ContributionType = "financial" | "in_kind" | "services";
export type StatusType = "pending" | "confirmed" | "completed" | "cancelled";

// ─── car_reservations ────────────────────────────────────────────────────────
// Supabase table: car_reservations
// Columns: id, created_at, name, email, phone, package, notes, status

export interface CarReservation {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  package: PackageType;
  notes: string | null;
  status: StatusType;
}

export type CarReservationInput = Omit<CarReservation, "id" | "created_at" | "status">;

// ─── volunteers ──────────────────────────────────────────────────────────────
// Supabase table: volunteers
// Columns: id, created_at, name, email, phone, availability, tasks, notes, status

export interface Volunteer {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  availability: AvailabilityType;
  tasks: string[];   // stored as text[] in Postgres
  notes: string | null;
  status: Extract<StatusType, "pending" | "confirmed">;
}

export type VolunteerInput = Omit<Volunteer, "id" | "created_at" | "status">;

// ─── baking_contributions ────────────────────────────────────────────────────
// Supabase table: baking_contributions
// Columns: id, created_at, name, email, phone, item_description, quantity, dietary_info, notes, status

export interface BakingContribution {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  item_description: string;
  quantity: number;
  dietary_info: string | null;
  notes: string | null;
  status: Extract<StatusType, "pending" | "confirmed">;
}

export type BakingContributionInput = Omit<BakingContribution, "id" | "created_at" | "status">;

// ─── sponsor_contributions ───────────────────────────────────────────────────
// Supabase table: sponsor_contributions
// Columns: id, created_at, company_name, contact_name, email, phone, contribution_type, amount, description, status

export interface SponsorContribution {
  id: string;
  created_at: string;
  company_name: string | null;
  contact_name: string;
  email: string;
  phone: string | null;
  contribution_type: ContributionType;
  amount: number | null;
  description: string | null;
  status: Extract<StatusType, "pending" | "confirmed">;
}

export type SponsorContributionInput = Omit<SponsorContribution, "id" | "created_at" | "status">;

// ─── material_contributions ──────────────────────────────────────────────────
// Supabase table: material_contributions
// Columns: id, created_at, name, email, phone, item_description, quantity, notes, status

export interface MaterialContribution {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  item_description: string;
  quantity: number | null;
  notes: string | null;
  status: Extract<StatusType, "pending" | "confirmed">;
}

export type MaterialContributionInput = Omit<MaterialContribution, "id" | "created_at" | "status">;
