// Core domain types mirroring the Supabase schema (see supabase/migrations).
// In Phase 1 these are populated from in-memory seed data instead of a database.

export type ListingSource = "zyla_bizbuysell" | "csv" | "manual";

export type DealStatus =
  | "New"
  | "Reviewing"
  | "Contacted Broker"
  | "Under NDA"
  | "Passed"
  | "LOI Sent";

export type Recommendation = "Call Broker" | "Save for Later" | "Pass";

/** Vocabulary used by the AI memo's "Final Recommendation" section (PROJECT_SPEC.md §12) — distinct from `Recommendation`. */
export type MemoRecommendation = "Strong Buy Candidate" | "Investigate Further" | "Pass";

export interface BusinessListing {
  id: string;
  source: ListingSource;
  source_listing_id: string;
  listing_url: string | null;
  business_name: string;
  industry: string | null;
  location_city: string | null;
  location_state: string | null;
  asking_price: number | null;
  gross_revenue: number | null;
  cash_flow_sde: number | null;
  ebitda: number | null;
  inventory_included: boolean | null;
  real_estate_included: boolean | null;
  ff_e_value: number | null;
  rent: number | null;
  employees: number | null;
  years_established: number | null;
  reason_for_sale: string | null;
  financing_available: boolean | null;
  description: string | null;
  broker_name: string | null;
  broker_phone: string | null;
  broker_email: string | null;
  date_listed: string | null; // ISO date
  last_seen_at: string; // ISO datetime
  raw_provider_json: unknown;
  status: DealStatus;
  created_at: string;
  updated_at: string;
}

export interface DealMetrics {
  id: string;
  business_listing_id: string;
  sde_multiple: number | null;
  revenue_multiple: number | null;
  sde_margin: number | null;
  payback_period_years: number | null;
  estimated_down_payment: number | null;
  estimated_loan_amount: number | null;
  estimated_annual_debt_service: number | null;
  dscr: number | null;
  estimated_cash_on_cash_return: number | null;
  created_at: string;
  updated_at: string;
}

export interface DealScore {
  id: string;
  business_listing_id: string;
  total_score: number;
  valuation_score: number;
  cash_flow_quality_score: number;
  financing_fit_score: number;
  operational_complexity_score: number;
  growth_potential_score: number;
  red_flag_penalty: number;
  red_flags: string[];
  score_explanation: string;
  recommendation: Recommendation;
  created_at: string;
  updated_at: string;
}

export interface AiMemo {
  id: string;
  business_listing_id: string;
  memo_text: string;
  recommendation: MemoRecommendation | null;
  created_at: string;
}

export interface UserAssumptions {
  id: string;
  down_payment_percent: number; // e.g. 0.10
  interest_rate: number; // annual rate, e.g. 0.10
  loan_term_years: number;
  buyer_required_salary: number;
  minimum_dscr: number;
  target_cash_on_cash_return: number;
  created_at: string;
  updated_at: string;
}

export interface DealNote {
  id: string;
  business_listing_id: string;
  note_text: string;
  status: DealStatus;
  created_at: string;
  updated_at: string;
}

// Composite view used throughout the UI: a listing plus its derived data.
export interface ListingWithAnalysis {
  listing: BusinessListing;
  metrics: DealMetrics;
  score: DealScore;
  memo: AiMemo | null;
  notes: DealNote[];
}

export interface ListingFilters {
  source?: ListingSource;
  state?: string;
  city?: string;
  industry?: string;
  minAskingPrice?: number;
  maxAskingPrice?: number;
  minCashFlow?: number;
  keyword?: string;
}
