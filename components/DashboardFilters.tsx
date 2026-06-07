const STATUS_OPTIONS = ["New", "Reviewing", "Contacted Broker", "Under NDA", "Passed", "LOI Sent"];
const SOURCE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "zyla_bizbuysell", label: "Zyla — BizBuySell" },
  { value: "csv", label: "CSV Import" },
  { value: "manual", label: "Manual Entry" },
];

interface DashboardFiltersProps {
  states: string[];
  cities: string[];
  industries: string[];
  current: Record<string, string | undefined>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">{children}</label>;
}

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none";

export function DashboardFilters({ states, cities, industries, current }: DashboardFiltersProps) {
  return (
    <form method="get" className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div>
          <FieldLabel>Source</FieldLabel>
          <select name="source" defaultValue={current.source ?? ""} className={inputClass}>
            <option value="">All sources</option>
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>State</FieldLabel>
          <select name="state" defaultValue={current.state ?? ""} className={inputClass}>
            <option value="">All states</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel>City</FieldLabel>
          <select name="city" defaultValue={current.city ?? ""} className={inputClass}>
            <option value="">All cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel>Industry</FieldLabel>
          <select name="industry" defaultValue={current.industry ?? ""} className={inputClass}>
            <option value="">All industries</option>
            {industries.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel>Status</FieldLabel>
          <select name="status" defaultValue={current.status ?? ""} className={inputClass}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel>Keyword</FieldLabel>
          <input type="text" name="keyword" defaultValue={current.keyword ?? ""} placeholder="e.g. absentee" className={inputClass} />
        </div>

        <div>
          <FieldLabel>Min Asking Price</FieldLabel>
          <input type="number" name="minPrice" defaultValue={current.minPrice ?? ""} className={inputClass} />
        </div>
        <div>
          <FieldLabel>Max Asking Price</FieldLabel>
          <input type="number" name="maxPrice" defaultValue={current.maxPrice ?? ""} className={inputClass} />
        </div>
        <div>
          <FieldLabel>Min SDE</FieldLabel>
          <input type="number" name="minSde" defaultValue={current.minSde ?? ""} className={inputClass} />
        </div>
        <div>
          <FieldLabel>Max SDE</FieldLabel>
          <input type="number" name="maxSde" defaultValue={current.maxSde ?? ""} className={inputClass} />
        </div>
        <div>
          <FieldLabel>Min SDE Multiple</FieldLabel>
          <input type="number" step="0.1" name="minMultiple" defaultValue={current.minMultiple ?? ""} className={inputClass} />
        </div>
        <div>
          <FieldLabel>Max SDE Multiple</FieldLabel>
          <input type="number" step="0.1" name="maxMultiple" defaultValue={current.maxMultiple ?? ""} className={inputClass} />
        </div>
        <div>
          <FieldLabel>Min Deal Score</FieldLabel>
          <input type="number" name="minScore" min={0} max={100} defaultValue={current.minScore ?? ""} className={inputClass} />
        </div>
        <div>
          <FieldLabel>Max Deal Score</FieldLabel>
          <input type="number" name="maxScore" min={0} max={100} defaultValue={current.maxScore ?? ""} className={inputClass} />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
          Apply Filters
        </button>
        <a href="/dashboard" className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
          Clear
        </a>
      </div>
    </form>
  );
}
