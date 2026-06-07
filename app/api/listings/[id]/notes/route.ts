import { NextRequest, NextResponse } from "next/server";
import { addNote, getListingById } from "@/lib/data/store";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const noteText = (body?.note_text as string | undefined)?.trim();

  if (!noteText) {
    return NextResponse.json({ error: "note_text is required" }, { status: 400 });
  }

  const listing = getListingById(id);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const note = addNote(id, noteText, listing.status);
  return NextResponse.json({ note });
}
