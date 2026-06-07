import { SyncForm } from "@/components/SyncForm";

export default function SyncPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Sync Listings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pull new listings from the Zyla BizBuySell API, upload a CSV export, or enter a deal manually.
          Results are deduplicated by source + listing id, raw provider payloads are stored for debugging,
          and existing listings are updated in place.
        </p>
      </div>
      <SyncForm />
    </div>
  );
}
