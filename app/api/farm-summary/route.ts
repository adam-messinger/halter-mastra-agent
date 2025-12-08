import { prefetchFarmSummary } from "@/lib/farm-summary-cache";

export async function POST() {
  // Trigger prefetch without waiting
  prefetchFarmSummary();

  return Response.json({ status: "prefetching" });
}
