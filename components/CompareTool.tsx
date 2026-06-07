"use client";

import { useEffect, useMemo, useState } from "react";
import type { BusinessListing, DealMetrics, DealScore } from "@/lib/types";
import { formatCurrency, formatMultiple, formatNumber, formatPercent } from "@/lib/format";
import { ScoreBadge } from "./ScoreBadge";

interface Row {
  listing: BusinessListing;
  metrics: DealMetrics;
  score: DealScore;
}

const MAX_SELECTION = 5;
const MIN_SELECTION = 2;

export function CompareTool() {
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/listings")
      .then((res) => res.json())
      .then((data) => setRows(data.listings ?? []))
      .finally(() => setLoading(false));
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECTION) return prev;
      return [...prev, id];
    });
  }

  const selectedRows = useMemo(
    () => selected.map((id) => rows.find((r) => r.listing.id === id)).filter((r): r is Row => Boolean(r)),
    [selected, rows]
  );

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading listings…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <p className="mb-3 text-sm text-zinc-600">
          Select {MIN_SELECTION}–{MAX_SELECTION} listings to compare ({selected.length} selected).
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ listing, score }) => {
            const isChecked = selected.includes(listing.id);
            const disabled = !isChecked && selected.length >= MAX_SELECTION;
            return (
              <label
                key={listing.id}
                className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm ${
                  isChecked ? "border-zinc-900 bg-zinc-50" : "border-zinc-200"
                } ${disabled ? "opacity-50" : "cursor-pointer hover:bg-zinc-50"}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={disabled}
                  onChange={() => toggle(listing.id)}
                  className="h-4 w-4"
                />
                <span className="flex-1 truncate">{listing.business_name}</span>
                <ScoreBadge score={score.total_score} />
              </label>
            );
          })}
        </div>
      </div>

      {selectedRows.length >= MIN_SELECTION ? (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <tbody className="divide-y divide-zinc-100">
              <CompareRow label="Business" cells={selectedRows.map((r) => r.listing.business_name)} bold />
              <CompareRow label="Status" cells={selectedRows.map((r) => r.listing.status)} />
              <CompareRow label="Asking Price" cells={selectedRows.map((r) => formatCurrency(r.listing.asking_price))} />
              <CompareRow label="Gross Revenue" cells={selectedRows.map((r) => formatCurrency(r.listing.gross_revenue))} />
              <CompareRow label="SDE (Cash Flow)" cells={selectedRows.map((r) => formatCurrency(r.listing.cash_flow_sde))} />
              <CompareRow label="SDE Multiple" cells={selectedRows.map((r) => formatMultiple(r.metrics.sde_multiple))} />
              <CompareRow label="Revenue Multiple" cells={selectedRows.map((r) => formatMultiple(r.metrics.revenue_multiple))} />
              <CompareRow label="SDE Margin" cells={selectedRows.map((r) => formatPercent(r.metrics.sde_margin))} />
              <CompareRow label="DSCR" cells={selectedRows.map((r) => formatMultiple(r.metrics.dscr))} />
              <CompareRow
                label="Payback Period"
                cells={selectedRows.map((r) => (r.metrics.payback_period_years !== null ? `${formatNumber(r.metrics.payback_period_years)} yrs` : "—"))}
              />
              <CompareRow label="Deal Score" cells={selectedRows.map((r) => String(r.score.total_score))} bold />
              <CompareRow label="Recommendation" cells={selectedRows.map((r) => r.score.recommendation)} />
              <CompareRow label="Red Flags" cells={selectedRows.map((r) => String(r.score.red_flags.length))} />
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Select at least {MIN_SELECTION} listings to see a side-by-side comparison.</p>
      )}
    </div>
  );
}

function CompareRow({ label, cells, bold }: { label: string; cells: string[]; bold?: boolean }) {
  return (
    <tr>
      <th className="bg-zinc-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</th>
      {cells.map((cell, idx) => (
        <td key={idx} className={`px-4 py-3 text-zinc-700 ${bold ? "font-semibold text-zinc-900" : ""}`}>
          {cell}
        </td>
      ))}
    </tr>
  );
}
