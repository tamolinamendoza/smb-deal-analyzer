function colorForScore(score: number): string {
  if (score >= 70) return "bg-emerald-600";
  if (score >= 45) return "bg-amber-500";
  return "bg-rose-600";
}

export function ScoreBadge({ score }: { score: number }) {
  return (
    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${colorForScore(score)}`}>
      {score}
    </span>
  );
}
