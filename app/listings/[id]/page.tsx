import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingWithAnalysis } from "@/lib/data/store";
import { formatCurrency, formatDate, formatMultiple, formatNumber, formatPercent } from "@/lib/format";
import { ScoreBadge } from "@/components/ScoreBadge";
import { RecommendationBadge } from "@/components/RecommendationBadge";
import { StatusSelect } from "@/components/StatusSelect";
import { NotesPanel } from "@/components/NotesPanel";
import { MemoPanel } from "@/components/MemoPanel";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-zinc-900">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
      {children}
    </section>
  );
}

function yesNo(value: boolean | null): string {
  if (value === null) return "Not provided";
  return value ? "Yes" : "No";
}

const SCORE_ROWS: Array<{ key: string; label: string; max: number }> = [
  { key: "valuation_score", label: "Valuation", max: 25 },
  { key: "cash_flow_quality_score", label: "Cash Flow Quality", max: 20 },
  { key: "financing_fit_score", label: "Financing Fit", max: 15 },
  { key: "operational_complexity_score", label: "Operational Complexity", max: 15 },
  { key: "growth_potential_score", label: "Growth Potential", max: 15 },
];

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const analysis = getListingWithAnalysis(id);
  if (!analysis) notFound();

  const { listing, metrics, score, memo, notes } = analysis;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div>
        <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">← Back to dashboard</Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">{listing.business_name}</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {[listing.industry, listing.location_city, listing.location_state].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ScoreBadge score={score.total_score} />
            <RecommendationBadge recommendation={score.recommendation} />
            <StatusSelect listingId={listing.id} initialStatus={listing.status} />
          </div>
        </div>
      </div>

      <Section title="Business Summary">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Field label="Source" value={listing.source.replace(/_/g, " ")} />
          <Field
            label="Listing URL"
            value={
              listing.listing_url ? (
                <a href={listing.listing_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                  View original listing
                </a>
              ) : (
                "Not provided"
              )
            }
          />
          <Field label="Date Listed" value={formatDate(listing.date_listed)} />
          <Field label="Years Established" value={listing.years_established ?? "Not provided"} />
          <Field label="Employees" value={listing.employees ?? "Not provided"} />
          <Field label="Reason for Sale" value={listing.reason_for_sale ?? "Not provided"} />
          <Field label="Broker" value={listing.broker_name ?? "Not provided"} />
          <Field label="Broker Phone" value={listing.broker_phone ?? "Not provided"} />
          <Field label="Broker Email" value={listing.broker_email ?? "Not provided"} />
        </dl>
        {listing.description && (
          <div className="mt-5">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Description</dt>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{listing.description}</p>
          </div>
        )}
      </Section>

      <Section title="Financial Data">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Field label="Asking Price" value={formatCurrency(listing.asking_price)} />
          <Field label="Gross Revenue" value={formatCurrency(listing.gross_revenue)} />
          <Field label="Cash Flow (SDE)" value={formatCurrency(listing.cash_flow_sde)} />
          <Field label="EBITDA" value={formatCurrency(listing.ebitda)} />
          <Field label="Rent" value={formatCurrency(listing.rent)} />
          <Field label="FF&E Value" value={formatCurrency(listing.ff_e_value)} />
          <Field label="Inventory Included" value={yesNo(listing.inventory_included)} />
          <Field label="Real Estate Included" value={yesNo(listing.real_estate_included)} />
          <Field label="Financing Available" value={yesNo(listing.financing_available)} />
        </dl>
      </Section>

      <Section title="Calculated Metrics">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Field label="SDE Multiple" value={formatMultiple(metrics.sde_multiple)} />
          <Field label="Revenue Multiple" value={formatMultiple(metrics.revenue_multiple)} />
          <Field label="SDE Margin" value={formatPercent(metrics.sde_margin)} />
          <Field label="Payback Period" value={metrics.payback_period_years !== null ? `${formatNumber(metrics.payback_period_years)} yrs` : "—"} />
          <Field label="Est. Down Payment" value={formatCurrency(metrics.estimated_down_payment)} />
          <Field label="Est. Loan Amount" value={formatCurrency(metrics.estimated_loan_amount)} />
          <Field label="Est. Annual Debt Service" value={formatCurrency(metrics.estimated_annual_debt_service)} />
          <Field label="DSCR" value={formatMultiple(metrics.dscr)} />
          <Field label="Est. Cash-on-Cash Return" value={formatPercent(metrics.estimated_cash_on_cash_return)} />
        </dl>
      </Section>

      <Section title="Deal Score Breakdown">
        <div className="mb-4 flex items-center gap-3">
          <ScoreBadge score={score.total_score} />
          <span className="text-sm text-zinc-600">Total score out of 100 (red flag penalty already applied)</span>
        </div>
        <div className="space-y-2">
          {SCORE_ROWS.map((row) => {
            const value = (score as unknown as Record<string, number>)[row.key];
            return (
              <div key={row.key} className="flex items-center gap-3">
                <span className="w-48 text-sm text-zinc-600">{row.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-full rounded-full bg-zinc-900" style={{ width: `${(value / row.max) * 100}%` }} />
                </div>
                <span className="w-16 text-right text-sm font-medium text-zinc-700">{value}/{row.max}</span>
              </div>
            );
          })}
          <div className="flex items-center gap-3">
            <span className="w-48 text-sm text-zinc-600">Red Flag Penalty</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-rose-500" style={{ width: `${(score.red_flag_penalty / 10) * 100}%` }} />
            </div>
            <span className="w-16 text-right text-sm font-medium text-rose-600">-{score.red_flag_penalty.toFixed(1)}</span>
          </div>
        </div>
        <pre className="mt-5 whitespace-pre-wrap rounded-md bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-600">
          {score.score_explanation}
        </pre>
      </Section>

      <Section title="Red Flags">
        {score.red_flags.length === 0 ? (
          <p className="text-sm text-zinc-500">No red flags detected by the rule engine.</p>
        ) : (
          <ul className="space-y-2">
            {score.red_flags.map((flag) => (
              <li key={flag} className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                <span aria-hidden>⚑</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="AI Investment Memo">
        <MemoPanel listingId={listing.id} memo={memo} />
      </Section>

      <Section title="Notes">
        <NotesPanel listingId={listing.id} notes={notes} />
      </Section>
    </div>
  );
}
