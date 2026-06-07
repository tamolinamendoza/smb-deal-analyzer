import type { BusinessListing, ListingFilters, ListingSource } from "@/lib/types";

/**
 * Common shape returned by every provider before normalization.
 * `raw` is stored as-is in `raw_provider_json` for debugging/audit purposes.
 */
export interface RawListing {
  source_listing_id: string;
  raw: unknown;
}

/** Fields a provider can populate on a listing. Anything omitted stays null. */
export type NormalizedListing = Omit<
  BusinessListing,
  "id" | "status" | "created_at" | "updated_at" | "last_seen_at"
>;

export interface ListingProvider {
  source: ListingSource;
  name: string;

  /** Fetch a list of raw listings matching the given filters. */
  getListings(filters: ListingFilters): Promise<RawListing[]>;

  /** Fetch full details for a single listing by its provider-specific id. */
  getListingDetails(sourceListingId: string): Promise<RawListing | null>;

  /** Convert a raw provider payload into our normalized schema. Must not throw on missing fields. */
  normalizeListing(rawListing: RawListing): NormalizedListing;
}
