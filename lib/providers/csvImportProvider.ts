import type { ListingFilters } from "@/lib/types";
import type { ListingProvider, NormalizedListing, RawListing } from "./types";

/**
 * CSV import "provider" — converts rows from an uploaded CSV into raw listings.
 * Expected header row (case-insensitive, order-independent):
 *   source_listing_id, business_name, industry, location_city, location_state,
 *   asking_price, gross_revenue, cash_flow_sde, ebitda, inventory_included,
 *   real_estate_included, ff_e_value, rent, employees, years_established,
 *   reason_for_sale, financing_available, description, broker_name, broker_phone,
 *   broker_email, date_listed, listing_url
 */

const NUMERIC_FIELDS = [
  "asking_price",
  "gross_revenue",
  "cash_flow_sde",
  "ebitda",
  "ff_e_value",
  "rent",
  "employees",
  "years_established",
] as const;

const BOOLEAN_FIELDS = ["inventory_included", "real_estate_included", "financing_available"] as const;

function parseBoolean(value: string | undefined): boolean | null {
  if (value === undefined || value.trim() === "") return null;
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "y", "1"].includes(normalized)) return true;
  if (["false", "no", "n", "0"].includes(normalized)) return false;
  return null;
}

function parseNumber(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") return null;
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  if (cleaned === "") return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

/** Minimal CSV line parser supporting quoted fields with embedded commas. */
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((c) => c.trim());
}

export function parseCsv(csvText: string): RawListing[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const rows: RawListing[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = cells[idx] ?? "";
    });

    const sourceListingId = record["source_listing_id"] || `csv-row-${i}-${Date.now()}`;
    rows.push({ source_listing_id: sourceListingId, raw: record });
  }

  return rows;
}

export const csvImportProvider: ListingProvider = {
  source: "csv",
  name: "CSV Import",

  async getListings(_filters: ListingFilters): Promise<RawListing[]> {
    // CSV rows are supplied directly via upload; there is no remote catalog to query.
    return [];
  },

  async getListingDetails(_sourceListingId: string): Promise<RawListing | null> {
    return null;
  },

  normalizeListing(rawListing: RawListing): NormalizedListing {
    const record = rawListing.raw as Record<string, string>;

    const numbers: Record<string, number | null> = {};
    for (const field of NUMERIC_FIELDS) numbers[field] = parseNumber(record[field]);

    const booleans: Record<string, boolean | null> = {};
    for (const field of BOOLEAN_FIELDS) booleans[field] = parseBoolean(record[field]);

    return {
      source: "csv",
      source_listing_id: rawListing.source_listing_id,
      listing_url: record["listing_url"] || null,
      business_name: record["business_name"] || "Untitled Listing",
      industry: record["industry"] || null,
      location_city: record["location_city"] || null,
      location_state: record["location_state"] || null,
      asking_price: numbers.asking_price,
      gross_revenue: numbers.gross_revenue,
      cash_flow_sde: numbers.cash_flow_sde,
      ebitda: numbers.ebitda,
      inventory_included: booleans.inventory_included,
      real_estate_included: booleans.real_estate_included,
      ff_e_value: numbers.ff_e_value,
      rent: numbers.rent,
      employees: numbers.employees !== null ? Math.round(numbers.employees) : null,
      years_established: numbers.years_established !== null ? Math.round(numbers.years_established) : null,
      reason_for_sale: record["reason_for_sale"] || null,
      financing_available: booleans.financing_available,
      description: record["description"] || null,
      broker_name: record["broker_name"] || null,
      broker_phone: record["broker_phone"] || null,
      broker_email: record["broker_email"] || null,
      date_listed: record["date_listed"] || null,
      raw_provider_json: record,
    };
  },
};
