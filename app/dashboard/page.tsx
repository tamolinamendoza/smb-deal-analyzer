import {
  getAllListingsWithAnalysis,
  getDistinctValues,
  getLastSync,
} from "@/lib/data/store";
import type { ListingFilters } from "@/lib/types";
import { DashboardFilters } from "@/components/DashboardFilters";
import { ListingsTable } from "@/components/ListingsTable";
import { StatCard } from "@/components/StatCard";
import { formatCurrency, formatMultiple } from "@/lib/format";

export const dynamic = "force-dynamic";

interface SearchParams extends Record<string, string | undefined> {
  source?: string;
  state?: string;
  city?: string;
  industry?: string;
  status?: string;
  keyword?: string;
  minPrice?: string;
  maxPrice?: string;
  minSde?: string;
  maxSde?: string;
  minMultiple?: string;
  maxMultiple?: string;
  minScore?: string;
  maxScore?: string;
}

function toNumber(value: string | undefined): number | undefined {
  if (!value || value.trim() === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const filters: ListingFilters = {
    source: (params.source as ListingFilters["source"]) || undefined,
    state: params.state || undefined,
    city: params.city || undefined,
    industry: params.industry || undefined,
    minAskingPrice: toNumber(params.minPrice),
    maxAskingPrice: toNumber(params.maxPrice),
    minCashFlow: toNumber(params.minSde),
    keyword: params.keyword || undefined,
  };

  let rows = getAllListingsWithAnalysis(filters);

  // Filters not modeled in ListingFilters (status, multiple range, score range) are applied client-side here.
  if (params.status) {
    rows = rows.filter((r) => r.listing.status === params.status);
  }
  const maxSde = toNumber(params.maxSde);
  if (maxSde !== undefined) {
    rows = rows.filter((r) => r.listing.cash_flow_sde !== null && r.listing.cash_flow_sde <= maxSde);
  }
  const minMultiple = toNumber(params.minMultiple);
  const maxMultiple = toNumber(params.maxMultiple);
  if (minMultiple !== undefined) {
    rows = rows.filter((r) => r.metrics.sde_multiple !== null && r.metrics.sde_multiple >= minMultiple);
  }
  if (maxMultiple !== undefined) {
    rows = rows.filter((r) => r.metrics.sde_multiple !== null && r.metrics.sde_multiple <= maxMultiple);
  }
  const minScore = toNumber(params.minScore);
  const maxScore = toNumber(params.maxScore);
  if (minScore !== undefined) rows = rows.filter((r) => r.score.total_score >= minScore);
  if (maxScore !== undefined) rows = rows.filter((r) => r.score.total_score <= maxScore);

  const allRows = getAllListingsWithAnalysis();
  const lastSync = getLastSync();

  const askingPrices = allRows.map((r) => r.listing.asking_price).filter((v): v is number => v !== null);
  const sdeMultiples = allRows.map((r) => r.metrics.sde_multiple).filter((v): v is number => v !== null);
  const dealScores = allRows.map((r) => r.score.total_score);

  const newFromLastSync = allRows.filter((r) => lastSync.ids.includes(r.listing.id));
  const bestScoring = [...allRows].sort((a, b) => b.score.total_score - a.score.total_score).slice(0, 3);
  const redFlagDeals = allRows.filter((r) => r.score.red_flags.length > 0);
  const missingFinancials = allRows.filter(
    (r) => r.listing.asking_price === null || r.listing.cash_flow_sde === null || r.listing.gross_revenue === null
  );

  const avgAskingPrice = average(askingPrices);
  const avgSdeMultiple = average(sdeMultiples);
  const avgScore = average(dealScores);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Which listings are worth calling the broker about? Sort, filter, and triage into Call Broker / Save for Later / Pass.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
        <StatCard label="Total Listings" value={String(allRows.length)} />
        <StatCard
          label="New (Latest Sync)"
          value={String(newFromLastSync.length)}
          hint={lastSync.at ? new Date(lastSync.at).toLocaleString() : undefined}
        />
        <StatCard label="Avg Asking Price" value={avgAskingPrice !== null ? formatCurrency(avgAskingPrice) : "—"} />
        <StatCard label="Avg SDE Multiple" value={avgSdeMultiple !== null ? formatMultiple(avgSdeMultiple) : "—"} />
        <StatCard label="Avg Deal Score" value={avgScore !== null ? avgScore.toFixed(0) : "—"} />
        <StatCard label="Best-Scoring Deals" value={String(bestScoring.length)} hint={bestScoring.map((r) => r.listing.business_name).join(", ") || undefined} />
        <StatCard label="Red-Flag Deals" value={String(redFlagDeals.length)} />
        <StatCard label="Missing Financials" value={String(missingFinancials.length)} />
      </div>

      <DashboardFilters
        states={getDistinctValues("location_state")}
        cities={getDistinctValues("location_city")}
        industries={getDistinctValues("industry")}
        current={params}
      />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700">
            {rows.length} listing{rows.length === 1 ? "" : "s"}
          </h2>
        </div>
        <ListingsTable rows={rows} />
      </div>
    </div>
  );
}
