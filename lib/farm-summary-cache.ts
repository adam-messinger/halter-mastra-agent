import { halterMcp } from "@/mastra/mcp/halter";

interface CacheEntry {
  data: string;
  timestamp: number;
}

interface GlobalCache {
  farmSummary: CacheEntry | null;
  fetchPromise: Promise<string | null> | null;
}

// Use globalThis to survive Next.js hot reloads in dev mode
const globalForCache = globalThis as unknown as { farmSummaryCache?: GlobalCache };

if (!globalForCache.farmSummaryCache) {
  globalForCache.farmSummaryCache = {
    farmSummary: null,
    fetchPromise: null,
  };
}

const cacheStore = globalForCache.farmSummaryCache;

// 5-minute TTL
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getFarmSummary(): Promise<string | null> {
  // Return cached data if still valid
  if (cacheStore.farmSummary && Date.now() - cacheStore.farmSummary.timestamp < CACHE_TTL_MS) {
    console.log("Farm summary cache hit");
    return cacheStore.farmSummary.data;
  }

  // If already fetching, wait for that promise
  if (cacheStore.fetchPromise) {
    console.log("Farm summary fetch in progress, waiting...");
    return cacheStore.fetchPromise;
  }

  // Fetch fresh data
  console.log("Farm summary cache miss, fetching...");
  cacheStore.fetchPromise = fetchFarmSummary();

  try {
    const result = await cacheStore.fetchPromise;
    return result;
  } finally {
    cacheStore.fetchPromise = null;
  }
}

async function fetchFarmSummary(): Promise<string | null> {
  try {
    const tools = await halterMcp.getTools();
    const result = await tools.halter_get_farm_summary.execute({
      context: { include: [] },
    });

    if (result && !result.isError) {
      const content = result.content?.[0];
      if (content?.type === "text" && content.text) {
        cacheStore.farmSummary = {
          data: content.text,
          timestamp: Date.now(),
        };
        console.log("Farm summary cached successfully");
        return content.text;
      }
    } else {
      console.error("Farm summary returned error:", result);
    }
  } catch (error) {
    console.error("Failed to fetch farm summary:", error);
  }

  return null;
}

// Trigger prefetch without waiting for result
export function prefetchFarmSummary(): void {
  getFarmSummary().catch(() => {
    // Ignore errors during prefetch
  });
}
