import { NextRequest, NextResponse } from "next/server";
import { getListingWithAnalysis, saveMemo } from "@/lib/data/store";
import { generateInvestmentMemo, MemoServiceNotConfiguredError } from "@/lib/ai/memo-service";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const analysis = getListingWithAnalysis(id);

  if (!analysis) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  try {
    const { memoText, recommendation } = await generateInvestmentMemo(analysis);
    const memo = saveMemo(id, memoText, recommendation);
    return NextResponse.json({ memo });
  } catch (error) {
    if (error instanceof MemoServiceNotConfiguredError) {
      return NextResponse.json({ error: error.message, code: "not_configured" }, { status: 503 });
    }
    const message = error instanceof Error ? error.message : "Failed to generate memo";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
