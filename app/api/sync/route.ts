import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/providers";
import { parseCsv } from "@/lib/providers/csvImportProvider";
import type { ManualEntryInput } from "@/lib/providers/manualEntryProvider";
import { recordSyncResult, upsertNormalizedListing } from "@/lib/data/store";
import type { ListingFilters, ListingSource } from "@/lib/types";
import type { RawListing } from "@/lib/providers/types";

interface SyncRequestBody {
  source: ListingSource;
  filters?: ListingFilters;
  csvText?: string;
  manualEntry?: ManualEntryInput;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as SyncRequestBody | null;
  if (!body?.source) {
    return NextResponse.json({ error: "source is required" }, { status: 400 });
  }

  const provider = getProvider(body.source);
  let rawListings: RawListing[] = [];

  try {
    switch (body.source) {
      case "zyla_bizbuysell":
        rawListings = await provider.getListings(body.filters ?? {});
        break;
      case "csv":
        if (!body.csvText) {
          return NextResponse.json({ error: "csvText is required for CSV import" }, { status: 400 });
        }
        rawListings = parseCsv(body.csvText);
        break;
      case "manual":
        if (!body.manualEntry) {
          return NextResponse.json({ error: "manualEntry is required for manual entry" }, { status: 400 });
        }
        rawListings = [{ source_listing_id: body.manualEntry.source_listing_id || "", raw: body.manualEntry }];
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const results = rawListings.map((raw) => {
    const normalized = provider.normalizeListing(raw);
    return upsertNormalizedListing(normalized);
  });

  recordSyncResult(results.map((r) => r.listing.id));

  return NextResponse.json({
    synced: results.length,
    new: results.filter((r) => r.isNew).length,
    updated: results.filter((r) => !r.isNew).length,
    listings: results.map((r) => r.listing),
  });
}
