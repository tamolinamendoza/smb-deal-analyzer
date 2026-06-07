import type { ListingWithAnalysis, MemoRecommendation, UserAssumptions } from "@/lib/types";

/**
 * System instruction for the investment-memo prompt (PROJECT_SPEC.md section 12).
 * Kept verbatim so the model's behavior matches the spec exactly.
 */
export const MEMO_SYSTEM_PROMPT = `You are an experienced small-business acquisition analyst. Analyze a business-for-sale listing using ONLY the data provided. Do not invent facts. Do not assume missing financials. If something is missing, say it is missing and explain why that matters.`;

export const MEMO_SECTIONS = [
  "1. Executive Summary — is it attractive, risky, overpriced, underpriced, or impossible to judge on this data?",
  "2. Business Overview — what it does, where, industry, what operator it needs.",
  "3. Financial Snapshot — asking price, gross revenue, SDE, EBITDA (if any), SDE multiple, revenue multiple, SDE margin, payback period, est. annual debt service, DSCR, est. cash-on-cash. Mark any missing item \"Not provided.\"",
  "4. Valuation Opinion — cheap / fair / expensive / can't judge, and why.",
  "5. Financing Feasibility — DSCR, debt burden, required buyer salary, leverage.",
  "6. Main Risks — owner dependency, customer concentration, lease, employees, seasonality, margins, vague claims, missing financials, add-back risk, etc.",
  "7. Red Flags — direct, unsoftened.",
  "8. Diligence Questions — 10 specific questions for the broker/seller.",
  "9. Negotiation Angles — price, seller note, earnout, transition, inventory, working capital peg, add-back proof, financing contingency.",
  "10. Final Recommendation — exactly one of: Strong Buy Candidate / Investigate Further / Pass — with a short reason.",
] as const;

/**
 * Builds the full user-message content for the Claude memo request by
 * substituting the {{...}} placeholders from PROJECT_SPEC.md section 12
 * with the listing's calculated data.
 */
export function buildMemoUserPrompt(analysis: ListingWithAnalysis, assumptions: UserAssumptions): string {
  const { listing, metrics, score } = analysis;

  const business_listing_json = JSON.stringify(listing, null, 2);
  const deal_metrics_json = JSON.stringify(metrics, null, 2);
  const deal_score_json = JSON.stringify(
    {
      total_score: score.total_score,
      valuation_score: score.valuation_score,
      cash_flow_quality_score: score.cash_flow_quality_score,
      financing_fit_score: score.financing_fit_score,
      operational_complexity_score: score.operational_complexity_score,
      growth_potential_score: score.growth_potential_score,
      red_flag_penalty: score.red_flag_penalty,
      score_explanation: score.score_explanation,
      recommendation: score.recommendation,
    },
    null,
    2
  );
  const red_flags_json = JSON.stringify(score.red_flags, null, 2);
  const user_assumptions_json = JSON.stringify(assumptions, null, 2);

  return `Business listing data: ${business_listing_json}
Calculated deal metrics: ${deal_metrics_json}
Deal score breakdown: ${deal_score_json}
Detected red flags: ${red_flags_json}
User financing assumptions: ${user_assumptions_json}

Write a structured investment memo with these sections:

${MEMO_SECTIONS.join("\n")}

Tone: direct, skeptical, practical, investor-oriented, not promotional.`;
}

const RECOMMENDATION_PATTERNS: Array<{ pattern: RegExp; value: MemoRecommendation }> = [
  { pattern: /strong buy candidate/i, value: "Strong Buy Candidate" },
  { pattern: /investigate further/i, value: "Investigate Further" },
  { pattern: /\bpass\b/i, value: "Pass" },
];

/** Extracts the final recommendation line out of the generated memo text, if present. */
export function extractRecommendation(memoText: string): MemoRecommendation | null {
  const finalSectionIndex = memoText.search(/10\.\s*Final Recommendation/i);
  const searchSpace = finalSectionIndex >= 0 ? memoText.slice(finalSectionIndex) : memoText;

  for (const { pattern, value } of RECOMMENDATION_PATTERNS) {
    if (pattern.test(searchSpace)) return value;
  }
  return null;
}
