import type { BusinessListing, DealMetrics, DealScore, Recommendation } from "@/lib/types";

// Point budgets per component. Keep these in sync with PROJECT_SPEC.md section 5.
export const SCORE_WEIGHTS = {
  valuation: 25,
  cashFlowQuality: 20,
  financingFit: 15,
  operationalComplexity: 15,
  growthPotential: 15,
  maxRedFlagPenalty: 10,
} as const;

const VAGUE_PHRASES = [
  "huge potential",
  "absentee owner",
  "financials available upon request",
  "motivated seller",
  "seller financing available",
];

export interface RedFlag {
  code: string;
  label: string;
  detail: string;
}

interface ScoreComponent {
  points: number;
  max: number;
  reason: string;
}

export interface ScoreBreakdown {
  total_score: number;
  valuation_score: number;
  cash_flow_quality_score: number;
  financing_fit_score: number;
  operational_complexity_score: number;
  growth_potential_score: number;
  red_flag_penalty: number;
  red_flags: RedFlag[];
  score_explanation: string;
  recommendation: Recommendation;
}

function scoreValuation(listing: BusinessListing, metrics: DealMetrics): ScoreComponent {
  const max = SCORE_WEIGHTS.valuation;
  const { sde_multiple, revenue_multiple } = metrics;

  if (sde_multiple === null) {
    return { points: max * 0.4, max, reason: "SDE multiple unknown (missing asking price or SDE) — scored neutrally low." };
  }

  // Lower SDE multiple = cheaper = better. ~2x is excellent for an SMB, ~4x+ is rich.
  let points: number;
  let reason: string;
  if (sde_multiple <= 2.0) {
    points = max;
    reason = `SDE multiple of ${sde_multiple.toFixed(2)}x is attractively low (≤2.0x).`;
  } else if (sde_multiple <= 3.0) {
    points = max * 0.8;
    reason = `SDE multiple of ${sde_multiple.toFixed(2)}x is reasonable (2.0x–3.0x).`;
  } else if (sde_multiple <= 4.0) {
    points = max * 0.55;
    reason = `SDE multiple of ${sde_multiple.toFixed(2)}x is on the higher side (3.0x–4.0x).`;
  } else {
    points = max * 0.2;
    reason = `SDE multiple of ${sde_multiple.toFixed(2)}x exceeds the 4.0x threshold — looks overpriced relative to cash flow.`;
  }

  if (revenue_multiple !== null && revenue_multiple < 0.3) {
    points = Math.min(max, points + max * 0.1);
    reason += ` Revenue multiple (${revenue_multiple.toFixed(2)}x) is also low, supporting a fair-to-cheap valuation.`;
  }

  return { points, max, reason };
}

function scoreCashFlowQuality(listing: BusinessListing, metrics: DealMetrics): ScoreComponent {
  const max = SCORE_WEIGHTS.cashFlowQuality;
  const { sde_margin } = metrics;

  if (sde_margin === null) {
    return { points: max * 0.35, max, reason: "SDE margin unknown (missing SDE or revenue) — scored neutrally low." };
  }

  let points: number;
  let reason: string;
  if (sde_margin >= 0.25) {
    points = max;
    reason = `SDE margin of ${(sde_margin * 100).toFixed(1)}% is strong (≥25%).`;
  } else if (sde_margin >= 0.15) {
    points = max * 0.75;
    reason = `SDE margin of ${(sde_margin * 100).toFixed(1)}% is healthy (15%–25%).`;
  } else if (sde_margin >= 0.10) {
    points = max * 0.5;
    reason = `SDE margin of ${(sde_margin * 100).toFixed(1)}% is thin (10%–15%).`;
  } else {
    points = max * 0.2;
    reason = `SDE margin of ${(sde_margin * 100).toFixed(1)}% is weak (<10%) — cash flow quality is a concern.`;
  }

  return { points, max, reason };
}

function scoreFinancingFit(listing: BusinessListing, metrics: DealMetrics): ScoreComponent {
  const max = SCORE_WEIGHTS.financingFit;
  const { dscr } = metrics;

  if (dscr === null) {
    return { points: max * 0.35, max, reason: "DSCR unknown (cannot model debt service from available data) — scored neutrally low." };
  }

  let points: number;
  let reason: string;
  if (dscr >= 1.5) {
    points = max;
    reason = `Estimated DSCR of ${dscr.toFixed(2)}x comfortably covers debt service (≥1.5x).`;
  } else if (dscr >= 1.25) {
    points = max * 0.7;
    reason = `Estimated DSCR of ${dscr.toFixed(2)}x meets a typical lender minimum (1.25x–1.5x).`;
  } else if (dscr >= 1.0) {
    points = max * 0.35;
    reason = `Estimated DSCR of ${dscr.toFixed(2)}x is below the 1.25x lender comfort zone — tight financing fit.`;
  } else {
    points = 0;
    reason = `Estimated DSCR of ${dscr.toFixed(2)}x is below 1.0x — cash flow would not cover modeled debt service.`;
  }

  return { points, max, reason };
}

function scoreOperationalComplexity(listing: BusinessListing): ScoreComponent {
  const max = SCORE_WEIGHTS.operationalComplexity;
  let points = max * 0.6; // start neutral; adjust based on signals
  const notes: string[] = [];

  const employees = listing.employees;
  if (employees !== null) {
    if (employees <= 3) {
      points -= max * 0.25;
      notes.push(`only ${employees} employee(s) suggests heavy owner involvement`);
    } else if (employees >= 10) {
      points += max * 0.25;
      notes.push(`${employees} employees suggests an operator-independent team`);
    }
  } else {
    notes.push("employee count not provided");
  }

  const description = (listing.description || "").toLowerCase();
  if (description.includes("absentee owner") || description.includes("semi-absentee")) {
    points += max * 0.15;
    notes.push('listing claims "absentee owner" (unverified — treat as a claim, not a fact)');
  }
  if (description.includes("owner operator") || description.includes("hands-on")) {
    points -= max * 0.15;
    notes.push("listing indicates a hands-on owner-operator model");
  }

  points = Math.max(0, Math.min(max, points));
  const reason = notes.length
    ? `Operational complexity assessed from: ${notes.join("; ")}.`
    : "No strong signals on operational complexity; scored neutrally.";

  return { points, max, reason };
}

function scoreGrowthPotential(listing: BusinessListing, metrics: DealMetrics): ScoreComponent {
  const max = SCORE_WEIGHTS.growthPotential;
  let points = max * 0.5;
  const notes: string[] = [];

  const description = (listing.description || "").toLowerCase();
  const growthSignals = ["growing", "growth", "expansion", "untapped", "scalable", "new location"];
  if (growthSignals.some((s) => description.includes(s))) {
    points += max * 0.2;
    notes.push("description references growth/expansion (unverified claim)");
  }

  if (listing.years_established !== null) {
    if (listing.years_established >= 15) {
      points += max * 0.15;
      notes.push(`${listing.years_established} years in business signals durability`);
    } else if (listing.years_established < 3) {
      points -= max * 0.2;
      notes.push(`only ${listing.years_established} years established — limited track record`);
    }
  }

  if (metrics.sde_margin !== null && metrics.sde_margin >= 0.2) {
    points += max * 0.1;
    notes.push("healthy margin leaves room to reinvest in growth");
  }

  points = Math.max(0, Math.min(max, points));
  const reason = notes.length
    ? `Growth potential assessed from: ${notes.join("; ")}.`
    : "No strong signals on growth potential; scored neutrally — treat as unproven.";

  return { points, max, reason };
}

export function detectRedFlags(listing: BusinessListing, metrics: DealMetrics): RedFlag[] {
  const flags: RedFlag[] = [];
  const description = (listing.description || "").toLowerCase();

  if (listing.asking_price === null) {
    flags.push({ code: "missing_asking_price", label: "Missing asking price", detail: "Asking price was not provided by the source." });
  }
  if (listing.cash_flow_sde === null) {
    flags.push({ code: "missing_sde", label: "Missing cash flow (SDE)", detail: "Seller's discretionary earnings were not provided." });
  }
  if (listing.gross_revenue === null) {
    flags.push({ code: "missing_revenue", label: "Missing gross revenue", detail: "Gross revenue was not provided." });
  }

  if (metrics.sde_multiple !== null && metrics.sde_multiple > 4.0) {
    flags.push({
      code: "high_sde_multiple",
      label: "SDE multiple above 4.0x",
      detail: `Asking price is ${metrics.sde_multiple.toFixed(2)}x cash flow, above the 4.0x threshold for SMB deals.`,
    });
  }

  if (metrics.sde_margin !== null && metrics.sde_margin < 0.10) {
    flags.push({
      code: "low_sde_margin",
      label: "SDE margin below 10%",
      detail: `SDE is only ${(metrics.sde_margin * 100).toFixed(1)}% of revenue — thin profitability relative to scale.`,
    });
  }

  if (metrics.dscr !== null && metrics.dscr < 1.25) {
    flags.push({
      code: "low_dscr",
      label: "DSCR below 1.25x",
      detail: `Estimated DSCR of ${metrics.dscr.toFixed(2)}x is below the 1.25x level most lenders require.`,
    });
  }

  const matchedPhrases = VAGUE_PHRASES.filter((phrase) => description.includes(phrase));
  if (matchedPhrases.length > 0) {
    flags.push({
      code: "vague_language",
      label: "Vague or promotional language",
      detail: `Description uses unsupported phrase(s): "${matchedPhrases.join('", "')}" without backing detail.`,
    });
  }

  if (
    listing.rent !== null &&
    listing.gross_revenue !== null &&
    listing.gross_revenue > 0 &&
    listing.rent / listing.gross_revenue > 0.10
  ) {
    flags.push({
      code: "high_rent",
      label: "Rent high relative to revenue",
      detail: `Annual rent (${formatCurrency(listing.rent)}) is more than 10% of gross revenue (${formatCurrency(listing.gross_revenue)}).`,
    });
  }

  if (listing.years_established !== null && listing.years_established < 3) {
    flags.push({
      code: "young_business",
      label: "Business under 3 years old",
      detail: `Established ${listing.years_established} year(s) ago — limited operating history to validate financials.`,
    });
  }

  if (
    listing.gross_revenue !== null &&
    listing.cash_flow_sde !== null &&
    listing.gross_revenue > 0 &&
    listing.cash_flow_sde / listing.gross_revenue < 0.08 &&
    listing.gross_revenue > 500_000
  ) {
    flags.push({
      code: "high_revenue_low_cash_flow",
      label: "High revenue but low cash flow",
      detail: `Revenue of ${formatCurrency(listing.gross_revenue)} converts to only ${formatCurrency(listing.cash_flow_sde)} in SDE — investigate cost structure and add-backs.`,
    });
  }

  return flags;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function recommendationFromScore(totalScore: number, redFlags: RedFlag[]): Recommendation {
  const hardBlockers = redFlags.some((f) =>
    ["missing_asking_price", "missing_sde", "missing_revenue", "low_dscr"].includes(f.code)
  );

  if (totalScore >= 70 && !hardBlockers) return "Call Broker";
  if (totalScore >= 45) return "Save for Later";
  return "Pass";
}

export function scoreDeal(listing: BusinessListing, metrics: DealMetrics): ScoreBreakdown {
  const valuation = scoreValuation(listing, metrics);
  const cashFlowQuality = scoreCashFlowQuality(listing, metrics);
  const financingFit = scoreFinancingFit(listing, metrics);
  const operationalComplexity = scoreOperationalComplexity(listing);
  const growthPotential = scoreGrowthPotential(listing, metrics);

  const redFlags = detectRedFlags(listing, metrics);
  // Each red flag costs 2.5 points, capped at the max penalty.
  const red_flag_penalty = Math.min(SCORE_WEIGHTS.maxRedFlagPenalty, redFlags.length * 2.5);

  const rawTotal =
    valuation.points +
    cashFlowQuality.points +
    financingFit.points +
    operationalComplexity.points +
    growthPotential.points -
    red_flag_penalty;

  const total_score = Math.round(Math.max(0, Math.min(100, rawTotal)));

  const explanationParts = [
    `Valuation (${Math.round(valuation.points)}/${valuation.max}): ${valuation.reason}`,
    `Cash flow quality (${Math.round(cashFlowQuality.points)}/${cashFlowQuality.max}): ${cashFlowQuality.reason}`,
    `Financing fit (${Math.round(financingFit.points)}/${financingFit.max}): ${financingFit.reason}`,
    `Operational complexity (${Math.round(operationalComplexity.points)}/${operationalComplexity.max}): ${operationalComplexity.reason}`,
    `Growth potential (${Math.round(growthPotential.points)}/${growthPotential.max}): ${growthPotential.reason}`,
    `Red flag penalty: -${red_flag_penalty.toFixed(1)} (${redFlags.length} flag${redFlags.length === 1 ? "" : "s"} detected).`,
  ];

  const recommendation = recommendationFromScore(total_score, redFlags);

  return {
    total_score,
    valuation_score: Math.round(valuation.points),
    cash_flow_quality_score: Math.round(cashFlowQuality.points),
    financing_fit_score: Math.round(financingFit.points),
    operational_complexity_score: Math.round(operationalComplexity.points),
    growth_potential_score: Math.round(growthPotential.points),
    red_flag_penalty,
    red_flags: redFlags,
    score_explanation: explanationParts.join("\n"),
    recommendation,
  };
}

export function scoreToDealScore(
  businessListingId: string,
  breakdown: ScoreBreakdown,
  now: string
): DealScore {
  return {
    id: `score_${businessListingId}`,
    business_listing_id: businessListingId,
    total_score: breakdown.total_score,
    valuation_score: breakdown.valuation_score,
    cash_flow_quality_score: breakdown.cash_flow_quality_score,
    financing_fit_score: breakdown.financing_fit_score,
    operational_complexity_score: breakdown.operational_complexity_score,
    growth_potential_score: breakdown.growth_potential_score,
    red_flag_penalty: breakdown.red_flag_penalty,
    red_flags: breakdown.red_flags.map((f) => f.label),
    score_explanation: breakdown.score_explanation,
    recommendation: breakdown.recommendation,
    created_at: now,
    updated_at: now,
  };
}
