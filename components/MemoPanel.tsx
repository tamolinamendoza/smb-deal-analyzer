"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AiMemo } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function MemoPanel({ listingId, memo }: { listingId: string; memo: AiMemo | null }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/memo/${listingId}`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Failed to generate memo");
        }
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to generate memo");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {isPending ? "Generating…" : memo ? "Regenerate AI Memo" : "Generate AI Memo"}
        </button>
        {memo && <span className="text-xs text-zinc-500">Last generated {formatDate(memo.created_at)}</span>}
      </div>

      {error && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">{error}</div>
      )}

      {memo ? (
        <article className="prose prose-sm max-w-none whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white p-5 text-sm leading-relaxed text-zinc-800">
          {memo.memo_text}
        </article>
      ) : (
        !error && (
          <p className="text-sm text-zinc-500">
            No memo generated yet. Click &ldquo;Generate AI Memo&rdquo; to have Claude write a skeptical investment memo
            from this listing&rsquo;s data, metrics, score, and red flags.
          </p>
        )
      )}
    </div>
  );
}
