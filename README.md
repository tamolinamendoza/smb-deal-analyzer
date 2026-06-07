# SMB Deal Analyzer

Analyze small businesses for sale, calculate the financials, score each deal with
transparent rules, and (eventually) have Claude write a skeptical investment memo.
The product question this app answers: **"Which listings are worth calling the
broker about?"** — every listing is triaged into **Call Broker / Save for Later / Pass**.

## Status: Phase 1 — Seed data only

This phase runs entirely off **5 fake seed listings** held in memory
(`lib/data/seed-listings.ts` + `lib/data/store.ts`). No external services
(Supabase, Anthropic, Zyla) are required to run it. The provider architecture,
calculations, scoring engine, dashboard, detail page, sync UI, and comparison
tool are all fully wired up against this in-memory store so that swapping in
real data sources later (Phases 2–4) is a localized change.

## Running it locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) — it redirects to `/dashboard`.

You should see:

- **Dashboard** (`/dashboard`) — portfolio stats (total listings, average asking
  price, average SDE multiple, average deal score, red-flag deals, missing
  financials, etc.), filters, and a sortable table of all 5 seed listings with
  their calculated deal score and Call Broker / Save for Later / Pass recommendation.
- **Listing detail** (`/listings/[id]`) — full business summary, financial data,
  calculated metrics (SDE multiple, DSCR, cash-on-cash return, etc.), a
  transparent score breakdown with red flags, a status dropdown, a notes panel,
  and an "Generate AI Memo" button.
- **Sync** (`/sync`) — choose a provider (Zyla / CSV / Manual), enter filters or
  upload a CSV or type in a deal, and click "Sync Listings" to add it to the
  in-memory store (deduplicated by `source` + `source_listing_id`).
- **Compare** (`/compare`) — select 2–5 listings and see them side by side.

Try clicking **Generate AI Memo** on a listing detail page — in Phase 1 (no
`ANTHROPIC_API_KEY` configured) it will return a clear "not configured yet"
message rather than failing silently. That's expected until Phase 3.

## Build phases

1. **Phase 1 (this phase)** — full app on seed data, no external APIs.
2. **Phase 2** — wire up Supabase (provide `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
3. **Phase 3** — wire up the Anthropic Claude API for AI memos (provide
   `ANTHROPIC_API_KEY`, optionally override `LLM_MODEL`).
4. **Phase 4** — wire up the Zyla Labs BizBuySell provider for live listings
   (provide `ZYLA_API_KEY`, `ZYLA_BIZBUYSELL_API_BASE_URL`).

Copy `.env.example` to `.env.local` and fill in keys as each phase is unlocked.
**Never commit real API keys.**

## Architecture

- **Provider layer** (`lib/providers/`) — a common `ListingProvider` interface
  (`getListings`, `getListingDetails`, `normalizeListing`) implemented by:
  - `zylaBizBuySellProvider` — Zyla Labs BizBuySell Listings API (Phase 4 stub;
    throws a clear "not configured" error until env vars are set)
  - `csvImportProvider` — parses an uploaded CSV into normalized listings
  - `manualEntryProvider` — normalizes a single hand-typed listing
- **Calculations** (`lib/calculations/deal-calculations.ts`) — SDE multiple,
  revenue multiple, SDE margin, payback period, estimated down payment/loan,
  PMT-based annual debt service, DSCR, and cash-on-cash return. All division is
  guarded against missing/zero denominators.
- **Scoring** (`lib/scoring/deal-scoring.ts`) — transparent 0–100 rule-based
  score (Valuation 25 / Cash Flow Quality 20 / Financing Fit 15 / Operational
  Complexity 15 / Growth Potential 15 / Red Flag Penalty up to −10) plus red
  flag detection (missing financials, SDE multiple > 4x, SDE margin < 10%,
  DSCR < 1.25x, vague listing language, high rent-to-revenue, young business,
  high-revenue/low-cash-flow). Every score component carries a human-readable
  explanation.
- **Data store** (`lib/data/store.ts`) — Phase 1 in-memory store standing in for
  Supabase; exposes the same operations (search/upsert/notes/status/memos/
  assumptions) that the Supabase-backed version will need in Phase 2.
- **AI memo** (`lib/ai/`) — prompt builder following the structured memo format
  in `PROJECT_SPEC.md` §12, and a service that calls the official
  `@anthropic-ai/sdk` once `ANTHROPIC_API_KEY` is set (Phase 3).

## Environment variables

See `.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ZYLA_API_KEY=
ZYLA_BIZBUYSELL_API_BASE_URL=
ANTHROPIC_API_KEY=
LLM_MODEL=claude-sonnet-4-6
```

Never hard-code API keys — only environment variables are read.
