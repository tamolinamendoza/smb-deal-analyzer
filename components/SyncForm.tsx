"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ListingSource } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none";

interface SyncResult {
  synced: number;
  new: number;
  updated: number;
}

export function SyncForm() {
  const [source, setSource] = useState<ListingSource>("manual");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Provider filter fields (Zyla)
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [industry, setIndustry] = useState("");
  const [minAskingPrice, setMinAskingPrice] = useState("");
  const [maxAskingPrice, setMaxAskingPrice] = useState("");
  const [minCashFlow, setMinCashFlow] = useState("");
  const [keyword, setKeyword] = useState("");

  // CSV
  const [csvText, setCsvText] = useState("");
  const [csvFileName, setCsvFileName] = useState<string | null>(null);

  // Manual entry
  const [businessName, setBusinessName] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [grossRevenue, setGrossRevenue] = useState("");
  const [cashFlowSde, setCashFlowSde] = useState("");
  const [manualState, setManualState] = useState("");
  const [manualCity, setManualCity] = useState("");
  const [manualIndustry, setManualIndustry] = useState("");
  const [manualDescription, setManualDescription] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function numberOrUndefined(value: string): number | undefined {
    if (value.trim() === "") return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    let payload: Record<string, unknown>;

    if (source === "zyla_bizbuysell") {
      payload = {
        source,
        filters: {
          state: state || undefined,
          city: city || undefined,
          industry: industry || undefined,
          minAskingPrice: numberOrUndefined(minAskingPrice),
          maxAskingPrice: numberOrUndefined(maxAskingPrice),
          minCashFlow: numberOrUndefined(minCashFlow),
          keyword: keyword || undefined,
        },
      };
    } else if (source === "csv") {
      if (!csvText.trim()) {
        setError("Upload a CSV file first.");
        return;
      }
      payload = { source, csvText };
    } else {
      if (!businessName.trim()) {
        setError("Business name is required for manual entry.");
        return;
      }
      payload = {
        source,
        manualEntry: {
          business_name: businessName,
          asking_price: numberOrUndefined(askingPrice),
          gross_revenue: numberOrUndefined(grossRevenue),
          cash_flow_sde: numberOrUndefined(cashFlowSde),
          location_state: manualState || undefined,
          location_city: manualCity || undefined,
          industry: manualIndustry || undefined,
          description: manualDescription || undefined,
        },
      };
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Sync failed");
        setResult({ synced: data.synced, new: data.new, updated: data.updated });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sync failed");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700">Provider</label>
        <div className="flex gap-2">
          {(["zyla_bizbuysell", "csv", "manual"] as ListingSource[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSource(option)}
              className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                source === option
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {option === "zyla_bizbuysell" ? "Zyla (BizBuySell)" : option === "csv" ? "CSV Upload" : "Manual Entry"}
            </button>
          ))}
        </div>
      </div>

      {source === "zyla_bizbuysell" && (
        <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">
            Live Zyla sync requires <code className="rounded bg-zinc-100 px-1 py-0.5">ZYLA_API_KEY</code> and{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5">ZYLA_BIZBUYSELL_API_BASE_URL</code> (Phase 4). Until
            those are set, syncing will return a configuration error.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <input className={inputClass} placeholder="State (e.g. WA)" value={state} onChange={(e) => setState(e.target.value)} />
            <input className={inputClass} placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <input className={inputClass} placeholder="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
            <input className={inputClass} placeholder="Min Asking Price" type="number" value={minAskingPrice} onChange={(e) => setMinAskingPrice(e.target.value)} />
            <input className={inputClass} placeholder="Max Asking Price" type="number" value={maxAskingPrice} onChange={(e) => setMaxAskingPrice(e.target.value)} />
            <input className={inputClass} placeholder="Min Cash Flow" type="number" value={minCashFlow} onChange={(e) => setMinCashFlow(e.target.value)} />
            <input className={inputClass} placeholder="Keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
        </div>
      )}

      {source === "csv" && (
        <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">
            Upload a CSV with a header row. Supported columns include business_name, industry, location_city,
            location_state, asking_price, gross_revenue, cash_flow_sde, ebitda, rent, employees, years_established,
            description, broker_name, broker_phone, broker_email, listing_url, and more.
          </p>
          <input type="file" accept=".csv,text/csv" onChange={handleFile} className="text-sm" />
          {csvFileName && <p className="text-xs text-zinc-500">Loaded: {csvFileName}</p>}
        </div>
      )}

      {source === "manual" && (
        <div className="grid grid-cols-2 gap-4 rounded-lg border border-zinc-200 bg-white p-5 sm:grid-cols-3">
          <input className={inputClass} placeholder="Business name *" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          <input className={inputClass} placeholder="Industry" value={manualIndustry} onChange={(e) => setManualIndustry(e.target.value)} />
          <input className={inputClass} placeholder="City" value={manualCity} onChange={(e) => setManualCity(e.target.value)} />
          <input className={inputClass} placeholder="State" value={manualState} onChange={(e) => setManualState(e.target.value)} />
          <input className={inputClass} placeholder="Asking Price" type="number" value={askingPrice} onChange={(e) => setAskingPrice(e.target.value)} />
          <input className={inputClass} placeholder="Gross Revenue" type="number" value={grossRevenue} onChange={(e) => setGrossRevenue(e.target.value)} />
          <input className={inputClass} placeholder="Cash Flow (SDE)" type="number" value={cashFlowSde} onChange={(e) => setCashFlowSde(e.target.value)} />
          <textarea className={`${inputClass} sm:col-span-3`} rows={3} placeholder="Description" value={manualDescription} onChange={(e) => setManualDescription(e.target.value)} />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {isPending ? "Syncing…" : "Sync Listings"}
        </button>
        {result && (
          <span className="text-sm text-emerald-700">
            Synced {result.synced} listing{result.synced === 1 ? "" : "s"} ({result.new} new, {result.updated} updated).
          </span>
        )}
        {error && <span className="text-sm text-rose-600">{error}</span>}
      </div>
    </form>
  );
}
