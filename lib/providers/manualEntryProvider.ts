import type { ListingFilters } from "@/lib/types";
import type { ListingProvider, NormalizedListing, RawListing } from "./types";

/**
 * Manual entry "provider" — wraps a single listing typed in by the user via the sync UI.
 * getListings/getListingDetails are not meaningful here (there's no remote source to query);
 * the form posts a raw payload directly and we normalize it the same way other providers do.
 */
export interface ManualEntryInput {
  source_listing_id?: string;
  business_name: string;
  industry?: string;
  location_city?: string;
  location_state?: string;
  asking_price?: number;
  gross_revenue?: number;
  cash_flow_sde?: number;
  ebitda?: number;
  inventory_included?: boolean;
  real_estate_included?: boolean;
  ff_e_value?: number;
  rent?: number;
  employees?: number;
  years_established?: number;
  reason_for_sale?: string;
  financing_available?: boolean;
  description?: string;
  broker_name?: string;
  broker_phone?: string;
  broker_email?: string;
  date_listed?: string;
  listing_url?: string;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const manualEntryProvider: ListingProvider = {
  source: "manual",
  name: "Manual Entry",

  async getListings(_filters: ListingFilters): Promise<RawListing[]> {
    // Manual entry has no remote catalog to list — listings are submitted one at a time.
    return [];
  },

  async getListingDetails(_sourceListingId: string): Promise<RawListing | null> {
    return null;
  },

  normalizeListing(rawListing: RawListing): NormalizedListing {
    const input = rawListing.raw as ManualEntryInput;
    const sourceListingId =
      rawListing.source_listing_id ||
      input.source_listing_id ||
      `manual-${slugify(input.business_name)}-${Date.now()}`;

    return {
      source: "manual",
      source_listing_id: sourceListingId,
      listing_url: input.listing_url ?? null,
      business_name: input.business_name,
      industry: input.industry ?? null,
      location_city: input.location_city ?? null,
      location_state: input.location_state ?? null,
      asking_price: input.asking_price ?? null,
      gross_revenue: input.gross_revenue ?? null,
      cash_flow_sde: input.cash_flow_sde ?? null,
      ebitda: input.ebitda ?? null,
      inventory_included: input.inventory_included ?? null,
      real_estate_included: input.real_estate_included ?? null,
      ff_e_value: input.ff_e_value ?? null,
      rent: input.rent ?? null,
      employees: input.employees ?? null,
      years_established: input.years_established ?? null,
      reason_for_sale: input.reason_for_sale ?? null,
      financing_available: input.financing_available ?? null,
      description: input.description ?? null,
      broker_name: input.broker_name ?? null,
      broker_phone: input.broker_phone ?? null,
      broker_email: input.broker_email ?? null,
      date_listed: input.date_listed ?? null,
      raw_provider_json: rawListing.raw,
    };
  },
};
