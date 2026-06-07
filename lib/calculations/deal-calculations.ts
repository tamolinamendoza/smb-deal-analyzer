import type { BusinessListing, DealMetrics, UserAssumptions } from "@/lib/types";

/**
 * Standard loan payment (PMT) formula for an annuity:
 *   payment = P * r / (1 - (1 + r)^-n)
 * where P = principal, r = periodic interest rate, n = number of periods.
 */
export function calculateAnnualDebtService(
  loanAmount: number,
  annualInterestRate: number,
  loanTermYears: number
): number | null {
  if (loanAmount <= 0 || loanTermYears <= 0) return null;
  if (annualInterestRate === 0) return loanAmount / loanTermYears;

  const r = annualInterestRate;
  const n = loanTermYears;
  const denominator = 1 - Math.pow(1 + r, -n);
  if (denominator === 0) return null;

  return (loanAmount * r) / denominator;
}

/** Safe division that returns null instead of Infinity/NaN when the denominator is missing or zero. */
function safeDivide(numerator: number | null, denominator: number | null): number | null {
  if (numerator === null || denominator === null || denominator === 0) return null;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : null;
}

export function calculateDealMetrics(
  listing: Pick<BusinessListing, "asking_price" | "gross_revenue" | "cash_flow_sde">,
  assumptions: UserAssumptions
): Omit<DealMetrics, "id" | "business_listing_id" | "created_at" | "updated_at"> {
  const { asking_price, gross_revenue, cash_flow_sde } = listing;

  const sde_multiple = safeDivide(asking_price, cash_flow_sde);
  const revenue_multiple = safeDivide(asking_price, gross_revenue);
  const sde_margin = safeDivide(cash_flow_sde, gross_revenue);

  // Payback period equals the SDE multiple by definition (asking_price / cash_flow_sde).
  const payback_period_years = sde_multiple;

  let estimated_down_payment: number | null = null;
  let estimated_loan_amount: number | null = null;
  let estimated_annual_debt_service: number | null = null;
  let dscr: number | null = null;
  let estimated_cash_on_cash_return: number | null = null;

  if (asking_price !== null && asking_price > 0) {
    estimated_down_payment = asking_price * assumptions.down_payment_percent;
    estimated_loan_amount = asking_price - estimated_down_payment;

    estimated_annual_debt_service = calculateAnnualDebtService(
      estimated_loan_amount,
      assumptions.interest_rate,
      assumptions.loan_term_years
    );

    if (estimated_annual_debt_service !== null && estimated_annual_debt_service > 0) {
      dscr = safeDivide(cash_flow_sde, estimated_annual_debt_service);

      if (cash_flow_sde !== null && estimated_down_payment > 0) {
        estimated_cash_on_cash_return =
          (cash_flow_sde - estimated_annual_debt_service) / estimated_down_payment;
      }
    }
  }

  return {
    sde_multiple,
    revenue_multiple,
    sde_margin,
    payback_period_years,
    estimated_down_payment,
    estimated_loan_amount,
    estimated_annual_debt_service,
    dscr,
    estimated_cash_on_cash_return,
  };
}
