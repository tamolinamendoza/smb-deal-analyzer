import type {
  AiMemo,
  BusinessListing,
  DealNote,
  DealStatus,
  ListingFilters,
  ListingWithAnalysis,
  UserAssumptions,
} from "@/lib/types";
import type { NormalizedListing } from "@/lib/providers/types";
import { seedListings } from "./seed-listings";
import { calculateDealMetrics } from "@/lib/calculations/deal-calculations";
import { scoreDeal, scoreToDealScore } from "@/lib/scoring/deal-scoring";

/**
 * Phase 1 in-memory data store.
 *
 * This stands in for Supabase until Phase 2 wires up a real database
 * (PROJECT_SPEC.md). It exposes the same shape of operations the API routes
 * need (list, get, upsert-by-source-id, notes, status, assumptions, memos) so
 * that swapping in a Supabase-backed implementation later is a localized change.
 *
 * Module state is stashed on `globalThis` so it survives Next.js dev-mode
 * hot-module-reload instead of resetting on every edit.
 */

const DEFAULT_ASSUMPTIONS: UserAssumptions = {
  id: "assumptions_default",
  down_payment_percent: 0.1,
  interest_rate: 0.105,
  loan_term_years: 10,
  buyer_required_salary: 70000,
  minimum_dscr: 1.25,
  target_cash_on_cash_return: 0.2,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

interface StoreState {
  listings: Map<string, BusinessListing>;
  notes: Map<string, DealNote[]>;
  memos: Map<string, AiMemo>;
  assumptions: UserAssumptions;
  lastSyncIds: Set<string>;
  lastSyncAt: string | null;
  seq: number;
}

function createInitialState(): StoreState {
  const state: StoreState = {
    listings: new Map(),
    notes: new Map(),
    memos: new Map(),
    assumptions: { ...DEFAULT_ASSUMPTIONS },
    lastSyncIds: new Set(),
    lastSyncAt: null,
    seq: 0,
  };

  const now = new Date().toISOString();
  for (const seed of seedListings) {
    const id = `listing_${state.seq++}`;
    const listing: BusinessListing = {
      ...seed,
      id,
      status: "New",
      last_seen_at: now,
      created_at: now,
      updated_at: now,
    };
    state.listings.set(id, listing);
    state.lastSyncIds.add(id);
  }
  state.lastSyncAt = now;

  return state;
}

const globalForStore = globalThis as unknown as { __dealStore?: StoreState };
const store: StoreState = globalForStore.__dealStore ?? createInitialState();
globalForStore.__dealStore = store;

function nowIso(): string {
  return new Date().toISOString();
}

// ---- Assumptions -----------------------------------------------------------

export function getAssumptions(): UserAssumptions {
  return store.assumptions;
}

export function updateAssumptions(partial: Partial<UserAssumptions>): UserAssumptions {
  store.assumptions = { ...store.assumptions, ...partial, updated_at: nowIso() };
  return store.assumptions;
}

// ---- Listings ---------------------------------------------------------------

export function getAllListings(): BusinessListing[] {
  return Array.from(store.listings.values());
}

export function getListingById(id: string): BusinessListing | null {
  return store.listings.get(id) ?? null;
}

function matchesFilters(listing: BusinessListing, filters: ListingFilters): boolean {
  if (filters.source && listing.source !== filters.source) return false;
  if (filters.state && listing.location_state?.toLowerCase() !== filters.state.toLowerCase()) return false;
  if (filters.city && listing.location_city?.toLowerCase() !== filters.city.toLowerCase()) return false;
  if (filters.industry && listing.industry?.toLowerCase() !== filters.industry.toLowerCase()) return false;
  if (filters.minAskingPrice !== undefined && (listing.asking_price ?? -Infinity) < filters.minAskingPrice) return false;
  if (filters.maxAskingPrice !== undefined && (listing.asking_price ?? Infinity) > filters.maxAskingPrice) return false;
  if (filters.minCashFlow !== undefined && (listing.cash_flow_sde ?? -Infinity) < filters.minCashFlow) return false;
  if (filters.keyword) {
    const haystack = `${listing.business_name} ${listing.description ?? ""} ${listing.industry ?? ""}`.toLowerCase();
    if (!haystack.includes(filters.keyword.toLowerCase())) return false;
  }
  return true;
}

export function searchListings(filters: ListingFilters): BusinessListing[] {
  return getAllListings().filter((listing) => matchesFilters(listing, filters));
}

/**
 * Upsert by (source, source_listing_id): updates existing rows in place
 * (preserving created_at, bumping last_seen_at), inserts new ones otherwise.
 * Mirrors the dedupe rule in PROJECT_SPEC.md section 2.
 */
export function upsertNormalizedListing(normalized: NormalizedListing): { listing: BusinessListing; isNew: boolean } {
  const existing = Array.from(store.listings.values()).find(
    (l) => l.source === normalized.source && l.source_listing_id === normalized.source_listing_id
  );

  const now = nowIso();

  if (existing) {
    const updated: BusinessListing = {
      ...existing,
      ...normalized,
      id: existing.id,
      status: existing.status,
      created_at: existing.created_at,
      last_seen_at: now,
      updated_at: now,
    };
    store.listings.set(existing.id, updated);
    return { listing: updated, isNew: false };
  }

  const id = `listing_${store.seq++}`;
  const created: BusinessListing = {
    ...normalized,
    id,
    status: "New",
    last_seen_at: now,
    created_at: now,
    updated_at: now,
  };
  store.listings.set(id, created);
  return { listing: created, isNew: true };
}

export function recordSyncResult(listingIds: string[]): void {
  store.lastSyncIds = new Set(listingIds);
  store.lastSyncAt = nowIso();
}

export function getLastSync(): { ids: string[]; at: string | null } {
  return { ids: Array.from(store.lastSyncIds), at: store.lastSyncAt };
}

export function updateListingStatus(id: string, status: DealStatus): BusinessListing | null {
  const listing = store.listings.get(id);
  if (!listing) return null;
  const updated = { ...listing, status, updated_at: nowIso() };
  store.listings.set(id, updated);
  return updated;
}

// ---- Derived analysis (metrics + score), computed on read -------------------
// Keeping these derived rather than stored mirrors the Supabase design (separate
// deal_metrics / deal_scores tables keyed by business_listing_id) while letting
// Phase 1 recompute instantly whenever assumptions change.

export function getAnalysis(listing: BusinessListing) {
  const now = listing.updated_at;
  const metricsPartial = calculateDealMetrics(listing, store.assumptions);
  const metrics = {
    id: `metrics_${listing.id}`,
    business_listing_id: listing.id,
    ...metricsPartial,
    created_at: now,
    updated_at: now,
  };
  const breakdown = scoreDeal(listing, metrics);
  const score = scoreToDealScore(listing.id, breakdown, now);
  return { metrics, score };
}

export function getListingWithAnalysis(id: string): ListingWithAnalysis | null {
  const listing = getListingById(id);
  if (!listing) return null;
  const { metrics, score } = getAnalysis(listing);
  return {
    listing,
    metrics,
    score,
    memo: store.memos.get(id) ?? null,
    notes: store.notes.get(id) ?? [],
  };
}

export function getAllListingsWithAnalysis(filters: ListingFilters = {}): ListingWithAnalysis[] {
  return searchListings(filters).map((listing) => {
    const { metrics, score } = getAnalysis(listing);
    return {
      listing,
      metrics,
      score,
      memo: store.memos.get(listing.id) ?? null,
      notes: store.notes.get(listing.id) ?? [],
    };
  });
}

// ---- Notes ------------------------------------------------------------------

export function addNote(listingId: string, noteText: string, status: DealStatus): DealNote {
  const note: DealNote = {
    id: `note_${store.seq++}`,
    business_listing_id: listingId,
    note_text: noteText,
    status,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  const existing = store.notes.get(listingId) ?? [];
  store.notes.set(listingId, [note, ...existing]);
  return note;
}

export function getNotes(listingId: string): DealNote[] {
  return store.notes.get(listingId) ?? [];
}

// ---- AI Memos ----------------------------------------------------------------

export function saveMemo(listingId: string, memoText: string, recommendation: AiMemo["recommendation"]): AiMemo {
  const memo: AiMemo = {
    id: `memo_${listingId}`,
    business_listing_id: listingId,
    memo_text: memoText,
    recommendation,
    created_at: nowIso(),
  };
  store.memos.set(listingId, memo);
  return memo;
}

export function getMemo(listingId: string): AiMemo | null {
  return store.memos.get(listingId) ?? null;
}

// ---- Filter option helpers (for dashboard dropdowns) ------------------------

export function getDistinctValues(field: "source" | "location_state" | "location_city" | "industry"): string[] {
  const values = new Set<string>();
  for (const listing of store.listings.values()) {
    const value = listing[field];
    if (value) values.add(String(value));
  }
  return Array.from(values).sort();
}
