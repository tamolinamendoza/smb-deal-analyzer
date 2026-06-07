import type { Recommendation } from "@/lib/types";

const STYLES: Record<Recommendation, string> = {
  "Call Broker": "bg-emerald-100 text-emerald-800 border-emerald-300",
  "Save for Later": "bg-amber-100 text-amber-800 border-amber-300",
  Pass: "bg-rose-100 text-rose-800 border-rose-300",
};

export function RecommendationBadge({ recommendation }: { recommendation: Recommendation }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${STYLES[recommendation]}`}>
      {recommendation}
    </span>
  );
}
