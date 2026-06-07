"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { DealStatus } from "@/lib/types";

const STATUS_OPTIONS: DealStatus[] = ["New", "Reviewing", "Contacted Broker", "Under NDA", "Passed", "LOI Sent"];

export function StatusSelect({ listingId, initialStatus }: { listingId: string; initialStatus: DealStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleChange(next: DealStatus) {
    setError(null);
    setStatus(next);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/listings/${listingId}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        if (!res.ok) throw new Error("Failed to update status");
        router.refresh();
      } catch {
        setError("Could not update status. Try again.");
        setStatus(initialStatus);
      }
    });
  }

  return (
    <div>
      <select
        value={status}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value as DealStatus)}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 focus:border-zinc-500 focus:outline-none disabled:opacity-60"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
