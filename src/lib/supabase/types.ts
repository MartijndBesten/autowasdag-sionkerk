// Supabase database type definitions

export type PackageType   = "buiten_wassen" | "compleet";
export type ReservationStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "paid_cash" | "paid_qr" | "donated_extra";
export type VolunteerStatus  = "pending" | "confirmed" | "cancelled";
export type ContributionType = "bakken" | "sponsoring" | "spullen" | "eten_verkopen" | "overig";
export type AvailabilityType = "full_day" | "morning" | "afternoon";
export type PlanningStatus   = "new" | "review" | "planned" | "assignment_sent" | "confirmed" | "cancelled" | "reserve" | "not_needed";
export type FinalShift       = "not_chosen" | "morning" | "afternoon" | "full_day" | "specific";

export interface CarReservation {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  phone: string | null;
  email: string;
  license_plate: string | null;
  package_type: PackageType;
  package_duration: number;
  reservation_date: string;
  reservation_time: string;
  extra_donation: number;
  payment_status: PaymentStatus;
  payment_method: string | null;
  notes: string | null;
  admin_notes: string | null;
  status: ReservationStatus;
  confirmation_sent: boolean;
  cancellation_token: string;
  slot_count: number;
}

export interface VolunteerSignup {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  phone: string | null;
  email: string;
  age_category: string | null;
  availability: AvailabilityType;
  selected_tasks: string[];
  contribution_details: string | null;
  cost_preference: string | null;
  notes: string | null;
  admin_notes: string | null;
  status: VolunteerStatus;
  // Planningsvelden (door organisatie in te vullen)
  final_tasks: string[];
  final_shift: FinalShift;
  final_start_time: string | null;
  final_end_time: string | null;
  internal_note: string | null;
  planning_status: PlanningStatus;
  assignment_email_sent: boolean;
  assignment_email_sent_at: string | null;
  is_deleted: boolean;
  selected_supplies: string[];
}

export interface ContributionSignup {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  phone: string | null;
  email: string;
  contribution_type: ContributionType;
  description: string | null;
  sponsorship_type: string | null;
  notes: string | null;
  admin_notes: string | null;
  status: VolunteerStatus;
}

export interface EventSettings {
  date: string;
  start_time: string;
  end_time: string;
  wash_bays: number;
  slot_duration_minutes: number;
  reservations_open: boolean;
  volunteers_open: boolean;
  max_reservations_per_slot: number;
}

export interface PriceSettings {
  buiten_wassen: number;
  compleet: number;
}

export interface TimelineItem {
  time: string; title: string; desc: string; color?: string;
}
export interface FaqItem {
  question: string; answer: string;
}
export interface PracticalItem {
  label: string; value: string; sub?: string;
}
export interface PackageDesc {
  name: string; tagline: string; description: string; includes: string[];
}

export interface Action {
  id: string;
  name: string;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  // Evenement
  event_date: string | null;
  start_time: string;
  end_time: string;
  wash_bays: number;
  max_slots_per_time: number;
  reservations_open: boolean;
  volunteers_open: boolean;
  price_buiten_wassen: number;
  price_compleet: number;
  notify_email: string | null;
  internal_notes: string | null;
  // Locatie
  location_address: string;
  location_city: string;
  location_postal: string;
  location_maps_url: string | null;
  // Homepage teksten
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  hero_image_path: string;
  action_tagline: string;
  coffee_text: string;
  // Gestructureerde content
  timeline: TimelineItem[];
  faq: FaqItem[];
  practical_info: PracticalItem[];
  package_descriptions: Record<string, PackageDesc>;
  // Footer
  footer_email: string;
  footer_website: string;
  footer_tagline: string | null;
}

export interface Database {
  public: {
    Tables: {
      car_reservations:    { Row: CarReservation;     Insert: Omit<CarReservation, "id"|"created_at"|"updated_at"|"cancellation_token">; Update: Partial<CarReservation> };
      volunteer_signups:   { Row: VolunteerSignup;    Insert: Omit<VolunteerSignup, "id"|"created_at"|"updated_at">;                     Update: Partial<VolunteerSignup> };
      contribution_signups:{ Row: ContributionSignup; Insert: Omit<ContributionSignup, "id"|"created_at"|"updated_at">;                  Update: Partial<ContributionSignup> };
      settings:            { Row: { id: string; key: string; value: unknown; updated_at: string; updated_by: string | null }; Insert: { key: string; value: unknown }; Update: { value?: unknown } };
      email_logs:          { Row: { id: string; created_at: string; to_address: string; subject: string; template: string | null; reference_id: string | null; reference_type: string | null; status: string; error: string | null }; Insert: Omit<{ id: string; created_at: string; to_address: string; subject: string; template: string | null; reference_id: string | null; reference_type: string | null; status: string; error: string | null }, "id"|"created_at">; Update: never };
      admin_users:         { Row: { id: string; email: string; created_at: string; is_active: boolean }; Insert: { id: string; email: string }; Update: { is_active?: boolean } };
    };
    Functions: {
      get_available_slots: { Args: { p_date: string }; Returns: { slot_time: string; available_bays: number }[] };
      is_admin: { Args: Record<never, never>; Returns: boolean };
    };
  };
}
