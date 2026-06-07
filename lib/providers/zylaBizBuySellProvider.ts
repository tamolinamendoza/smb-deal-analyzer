import type { ListingFilters } from "@/lib/types";
import type { ListingProvider, NormalizedListing, RawListing } from "./types";

/**
 * Zyla Labs BizBuySell Listings API provider.
 *
 * PHASE 4 STUB: request/response shapes are written defensively against an
 * unknown upstream schema. Field names below (`title`, `askingPrice`, `cashFlow`, ...)
 * are best-guess placeholders — confirm against the live Zyla docs/response payload
 * once `ZYLA_API_KEY` is available, then adjust `normalizeListing` accordingly.
 * Until then, `getListings`/`getListingDetails` throw a clear "not configured" error
 * rather than silently returning fake data.
 */

const ZYLA_API_KEY = process.env.ZYLA_API_KEY;
const ZYLA_BASE_URL = process.env.ZYLA_BIZBUYSELL_API_BASE_URL;

function assertConfigured(): void {
  if (!ZYLA_API_KEY || !ZYLA_BASE_URL) {
    throw new Error(
      "Zyla BizBuySell provider is not configured. Set ZYLA_API_KEY and ZYLA_BIZBUYSELL_API_BASE_URL " +
        "in your environment to enable live data sync (see PROJECT_SPEC.md Phase 4)."
    );
  }
}

function buildSearchParams(filters: ListingFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.state) params.set("state", filters.state);
  if (filters.city) params.set("city", filters.city);
  if (filters.industry) params.set("industry", filters.industry);
  if (filters.minAskingPrice !== undefined) params.set("min_asking_price", String(filters.minAskingPrice));
  if (filters.maxAskingPrice !== undefined) params.set("max_asking_price", String(filters.maxAskingPrice));
  if (filters.minCashFlow !== undefined) params.set("min_cash_flow", String(filters.minCashFlow));
  if (filters.keyword) params.set("keyword", filters.keyword);
  return params;
}

async function zylaFetch(path: string, params?: URLSearchParams): Promise<unknown> {
  assertConfigured();
  const url = `${ZYLA_BASE_URL!.replace(/\/$/, "")}${path}${params ? `?${params.toString()}` : ""}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${ZYLA_API_KEY}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Zyla BizBuySell API request failed (${response.status}): ${await response.text()}`);
  }

  return response.json();
}

/** Best-guess shape of a single listing returned by the Zyla BizBuySell endpoint. Verify against live data. */
interface ZylaListingPayload {
  id?: string | number;
  listingId?: string | number;
  url?: string;
  title?: string;
  businessName?: string;
  industry?: string;
  category?: string;
  city?: string;
  state?: string;
  askingPrice?: number | string;
  grossRevenue?: number | string;
  cashFlow?: number | string;
  ebitda?: number | string;
  inventoryIncluded?: boolean;
  realEstateIncluded?: boolean;
  ffe?: number | string;
  rent?: number | string;
  employees?: number | string;
  yearEstablished?: number | string;
  reasonForSale?: string;
  financingAvailable?: boolean;
  description?: string;
  brokerName?: string;
  brokerPhone?: string;
  brokerEmail?: string;
  datePosted?: string;
  [key: string]: unknown;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(num) ? num : null;
}

function toIntOrNull(value: unknown): number | null {
  const num = toNumber(value);
  return num === null ? null : Math.round(num);
}

export const zylaBizBuySellProvider: ListingProvider = {
  source: "zyla_bizbuysell",
  name: "Zyla Labs — BizBuySell",

  async getListings(filters: ListingFilters): Promise<RawListing[]> {
    const params = buildSearchParams(filters);
    const payload = (await zylaFetch("/listings", params)) as { results?: ZylaListingPayload[] } | ZylaListingPayload[];
    const results = Array.isArray(payload) ? payload : payload.results ?? [];

    return results.map((item) => ({
      source_listing_id: String(item.id ?? item.listingId ?? ""),
      raw: item,
    }));
  },

  async getListingDetails(sourceListingId: string): Promise<RawListing | null> {
    const payload = (await zylaFetch(`/listings/${encodeURIComponent(sourceListingId)}`)) as ZylaListingPayload;
    if (!payload) return null;
    return {
      source_listing_id: String(payload.id ?? payload.listingId ?? sourceListingId),
      raw: payload,
    };
  },

  normalizeListing(rawListing: RawListing): NormalizedListing {
    const item = rawListing.raw as ZylaListingPayload;

    return {
      source: "zyla_bizbuysell",
      source_listing_id: rawListing.source_listing_id,
      listing_url: item.url ?? null,
      business_name: item.title ?? item.businessName ?? "Untitled Listing",
      industry: item.industry ?? item.category ?? null,
      location_city: item.city ?? null,
      location_state: item.state ?? null,
      asking_price: toNumber(item.askingPrice),
      gross_revenue: toNumber(item.grossRevenue),
      cash_flow_sde: toNumber(item.cashFlow),
      ebitda: toNumber(item.ebitda),
      inventory_included: item.inventoryIncluded ?? null,
      real_estate_included: item.realEstateIncluded ?? null,
      ff_e_value: toNumber(item.ffe),
      rent: toNumber(item.rent),
      employees: toIntOrNull(item.employees),
      years_established: toIntOrNull(item.yearEstablished),
      reason_for_sale: item.reasonForSale ?? null,
      financing_available: item.financingAvailable ?? null,
      description: item.description ?? null,
      broker_name: item.brokerName ?? null,
      broker_phone: item.brokerPhone ?? null,
      broker_email: item.brokerEmail ?? null,
      date_listed: item.datePosted ?? null,
      raw_provider_json: item,
    };
  },
};
