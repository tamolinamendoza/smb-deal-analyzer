import type { ListingSource } from "@/lib/types";
import type { ListingProvider } from "./types";
import { zylaBizBuySellProvider } from "./zylaBizBuySellProvider";
import { csvImportProvider } from "./csvImportProvider";
import { manualEntryProvider } from "./manualEntryProvider";

export const providers: Record<ListingSource, ListingProvider> = {
  zyla_bizbuysell: zylaBizBuySellProvider,
  csv: csvImportProvider,
  manual: manualEntryProvider,
};

export function getProvider(source: ListingSource): ListingProvider {
  return providers[source];
}

export * from "./types";
export { zylaBizBuySellProvider, csvImportProvider, manualEntryProvider };
