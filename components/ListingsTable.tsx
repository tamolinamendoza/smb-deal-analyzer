import Link from "next/link";
import type { ListingWithAnalysis } from "@/lib/types";
import { formatCurrency, formatMultiple } from "@/lib/format";
import { ScoreBadge } from "./ScoreBadge";
import { RecommendationBadge } from "./RecommendationBadge";

export function ListingsTable({ rows }: { rows: ListingWithAnalysis[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
        No listings match these filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3">Business</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Asking Price</th>
            <th className="px-4 py-3">SDE</th>
            <th className="px-4 py-3">SDE Multiple</th>
            <th className="px-4 py-3">Score</th>
            <th className="px-4 py-3">Recommendation</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Red Flags</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map(({ listing, metrics, score }) => (
            <tr key={listing.id} className="hover:bg-zinc-50">
              <td className="px-4 py-3">
                <Link href={`/listings/${listing.id}`} className="font-medium text-zinc-900 hover:underline">
                  {listing.business_name}
                </Link>
                <div className="text-xs text-zinc-500">{listing.industry ?? "Industry unknown"}</div>
              </td>
              <td className="px-4 py-3 text-zinc-600">
                {[listing.location_city, listing.location_state].filter(Boolean).join(", ") || "—"}
              </td>
              <td className="px-4 py-3 text-zinc-700">{formatCurrency(listing.asking_price)}</td>
              <td className="px-4 py-3 text-zinc-700">{formatCurrency(listing.cash_flow_sde)}</td>
              <td className="px-4 py-3 text-zinc-700">{formatMultiple(metrics.sde_multiple)}</td>
              <td className="px-4 py-3">
                <ScoreBadge score={score.total_score} />
              </td>
              <td className="px-4 py-3">
                <RecommendationBadge recommendation={score.recommendation} />
              </td>
              <td className="px-4 py-3 text-zinc-600">{listing.status}</td>
              <td className="px-4 py-3">
                {score.red_flags.length > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">
                    {score.red_flags.length} flag{score.red_flags.length === 1 ? "" : "s"}
                  </span>
                ) : (
                  <span className="text-xs text-zinc-400">None</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
