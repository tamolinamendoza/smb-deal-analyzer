import { NextResponse } from "next/server";
import { getAllListingsWithAnalysis } from "@/lib/data/store";

export async function GET() {
  const rows = getAllListingsWithAnalysis();
  return NextResponse.json({
    listings: rows.map(({ listing, metrics, score }) => ({ listing, metrics, score })),
  });
}
