import { NextRequest, NextResponse } from "next/server";
import { addNote, getListingById, updateListingStatus } from "@/lib/data/store";
import type { DealStatus } from "@/lib/types";

const VALID_STATUSES: DealStatus[] = ["New", "Reviewing", "Contacted Broker", "Under NDA", "Passed", "LOI Sent"];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status as DealStatus | undefined;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const listing = getListingById(id);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const updated = updateListingStatus(id, status);
  if (listing.status !== status) {
    addNote(id, `Status changed from "${listing.status}" to "${status}".`, status);
  }

  return NextResponse.json({ listing: updated });
}
