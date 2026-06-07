"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { DealNote } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function NotesPanel({ listingId, notes }: { listingId: string; notes: DealNote[] }) {
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/listings/${listingId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note_text: trimmed }),
        });
        if (!res.ok) throw new Error("Failed to save note");
        setText("");
        router.refresh();
      } catch {
        setError("Could not save note. Try again.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Add a note about diligence findings, broker calls, etc."
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isPending || !text.trim()}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Add Note"}
          </button>
          {error && <span className="text-xs text-rose-600">{error}</span>}
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-zinc-500">No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
              <p className="whitespace-pre-wrap text-zinc-800">{note.note_text}</p>
              <p className="mt-1 text-xs text-zinc-500">{formatDate(note.created_at)} · status at the time: {note.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
