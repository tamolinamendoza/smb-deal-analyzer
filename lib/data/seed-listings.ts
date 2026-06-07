import type { NormalizedListing } from "@/lib/providers/types";

/**
 * Five realistic fake listings used to exercise the full app before any
 * external API key is configured (PROJECT_SPEC.md Phase 1 / section 10).
 * Each is shaped like a normalized listing so the same downstream pipeline
 * (metrics → scoring → memo) runs identically for seed and live data.
 */
export const seedListings: NormalizedListing[] = [
  {
    source: "manual",
    source_listing_id: "seed-001",
    listing_url: "https://example.com/listings/seed-001",
    business_name: "Riverside Laundromat & Wash-Dry-Fold",
    industry: "Laundry Services",
    location_city: "Tacoma",
    location_state: "WA",
    asking_price: 385000,
    gross_revenue: 410000,
    cash_flow_sde: 142000,
    ebitda: 128000,
    inventory_included: true,
    real_estate_included: false,
    ff_e_value: 220000,
    rent: 36000,
    employees: 4,
    years_established: 12,
    reason_for_sale: "Owner relocating out of state",
    financing_available: true,
    description:
      "Well-established coin laundry and wash-dry-fold service in a dense residential corridor. " +
      "Recently upgraded to high-efficiency machines (2022). Loyal customer base with steady walk-in traffic. " +
      "Owner currently works on-site about 20 hours/week handling wash-dry-fold orders and vendor management; " +
      "remaining staff covers daily floor operations. Lease has 6 years remaining with a renewal option.",
    broker_name: "Karen Voss",
    broker_phone: "(253) 555-0148",
    broker_email: "karen.voss@pnwbizbrokers.example.com",
    date_listed: "2026-03-02",
    raw_provider_json: null,
  },
  {
    source: "manual",
    source_listing_id: "seed-002",
    listing_url: "https://example.com/listings/seed-002",
    business_name: "Summit Ridge HVAC Services",
    industry: "HVAC / Home Services",
    location_city: "Boise",
    location_state: "ID",
    asking_price: 1250000,
    gross_revenue: 2100000,
    cash_flow_sde: 310000,
    ebitda: 275000,
    inventory_included: true,
    real_estate_included: false,
    ff_e_value: 180000,
    rent: 42000,
    employees: 14,
    years_established: 9,
    reason_for_sale: "Motivated seller — pursuing other ventures",
    financing_available: true,
    description:
      "Residential and light-commercial HVAC installation and service company covering the greater Boise metro. " +
      "Huge potential for growth into neighboring counties. Absentee owner for the past two years; general manager " +
      "runs day-to-day operations. Financials available upon request. Strong reputation with 4.8-star rating across " +
      "300+ reviews. Seasonal demand spikes in summer and winter.",
    broker_name: "Trent Aldous",
    broker_phone: "(208) 555-0117",
    broker_email: "trent@idahobizsales.example.com",
    date_listed: "2026-04-18",
    raw_provider_json: null,
  },
  {
    source: "manual",
    source_listing_id: "seed-003",
    listing_url: "https://example.com/listings/seed-003",
    business_name: "Brightside Pediatric Dental Practice",
    industry: "Healthcare / Dental",
    location_city: "Plano",
    location_state: "TX",
    asking_price: 2400000,
    gross_revenue: 1850000,
    cash_flow_sde: 540000,
    ebitda: 510000,
    inventory_included: false,
    real_estate_included: true,
    ff_e_value: 410000,
    rent: null,
    employees: 11,
    years_established: 18,
    reason_for_sale: "Owner-dentist retiring",
    financing_available: false,
    description:
      "Long-standing pediatric dental practice with two treatment suites and an in-house orthodontic referral pipeline. " +
      "Practice owns its building (included in sale). Patient base of roughly 3,800 active families with strong recurring " +
      "recall revenue. Requires a licensed dentist-operator; current owner sees patients four days a week and trains " +
      "incoming associates during a negotiable transition period.",
    broker_name: "Dana Whitfield",
    broker_phone: "(972) 555-0162",
    broker_email: "dana.whitfield@dfwpracticesales.example.com",
    date_listed: "2026-02-11",
    raw_provider_json: null,
  },
  {
    source: "manual",
    source_listing_id: "seed-004",
    listing_url: "https://example.com/listings/seed-004",
    business_name: "Velocity Fulfillment & Logistics LLC",
    industry: "Logistics / 3PL",
    location_city: "Reno",
    location_state: "NV",
    asking_price: 950000,
    gross_revenue: 3200000,
    cash_flow_sde: 165000,
    ebitda: 140000,
    inventory_included: false,
    real_estate_included: false,
    ff_e_value: 95000,
    rent: 310000,
    employees: 22,
    years_established: 5,
    reason_for_sale: "Partnership dispute; sale forced by buyout agreement",
    financing_available: true,
    description:
      "Third-party logistics and pick-pack-ship operation serving e-commerce clients across the Western US. " +
      "Two anchor clients represent the majority of monthly volume; contracts are renewed annually. Warehouse lease " +
      "recently renegotiated at a higher rate due to market conditions. Margins have compressed over the past 18 months " +
      "as fuel and labor costs increased. Seller financing available for a qualified buyer.",
    broker_name: "Mitch Ferraro",
    broker_phone: "(775) 555-0184",
    broker_email: "mitch@silverstatebizbrokers.example.com",
    date_listed: "2026-05-01",
    raw_provider_json: null,
  },
  {
    source: "manual",
    source_listing_id: "seed-005",
    listing_url: "https://example.com/listings/seed-005",
    business_name: "Copper Kettle Coffee Roasters",
    industry: "Food & Beverage / Cafe",
    location_city: "Asheville",
    location_state: "NC",
    asking_price: 295000,
    gross_revenue: 480000,
    cash_flow_sde: 58000,
    ebitda: 49000,
    inventory_included: true,
    real_estate_included: false,
    ff_e_value: 110000,
    rent: 64000,
    employees: 9,
    years_established: 2,
    reason_for_sale: "Owners moving closer to family",
    financing_available: false,
    description:
      "Boutique coffee roaster and cafe with a growing wholesale account base and a popular downtown storefront. " +
      "Motivated seller open to a quick close. New roastery equipment installed last year. Owners are hands-on and " +
      "currently manage roasting, purchasing, and staff scheduling personally — a new owner would need to either " +
      "take over these duties or hire a manager. Lease renews annually.",
    broker_name: "Selena Marsh",
    broker_phone: "(828) 555-0129",
    broker_email: "selena.marsh@blueridgebizbrokers.example.com",
    date_listed: "2026-01-22",
    raw_provider_json: null,
  },
];
