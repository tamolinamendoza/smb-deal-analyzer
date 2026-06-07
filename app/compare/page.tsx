import { CompareTool } from "@/components/CompareTool";

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Compare Deals</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Select 2–5 listings to compare asking price, financials, multiples, DSCR, deal score, and status side by side.
        </p>
      </div>
      <CompareTool />
    </div>
  );
}
