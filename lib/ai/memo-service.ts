import type { ListingWithAnalysis } from "@/lib/types";
import { getAssumptions } from "@/lib/data/store";
import { buildMemoUserPrompt, extractRecommendation, MEMO_SYSTEM_PROMPT } from "./memo-prompt";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL || "claude-sonnet-4-6";

export class MemoServiceNotConfiguredError extends Error {
  constructor() {
    super(
      "ANTHROPIC_API_KEY is not set. AI memo generation is wired up for Phase 3 — " +
        "add ANTHROPIC_API_KEY (and optionally LLM_MODEL) to your environment to enable it."
    );
    this.name = "MemoServiceNotConfiguredError";
  }
}

export interface GeneratedMemo {
  memoText: string;
  recommendation: ReturnType<typeof extractRecommendation>;
}

/**
 * Calls the Anthropic Claude API to generate a skeptical investment memo
 * (PROJECT_SPEC.md section 8 / 12). Uses the official @anthropic-ai/sdk.
 * Throws MemoServiceNotConfiguredError until ANTHROPIC_API_KEY is provided (Phase 3).
 */
export async function generateInvestmentMemo(analysis: ListingWithAnalysis): Promise<GeneratedMemo> {
  if (!ANTHROPIC_API_KEY) {
    throw new MemoServiceNotConfiguredError();
  }

  // Imported lazily so the package is only required once a key is configured.
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const assumptions = getAssumptions();
  const userPrompt = buildMemoUserPrompt(analysis, assumptions);

  const message = await client.messages.create({
    model: LLM_MODEL,
    max_tokens: 4096,
    system: MEMO_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const memoText = message.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { text: string }).text)
    .join("\n");

  return {
    memoText,
    recommendation: extractRecommendation(memoText),
  };
}
