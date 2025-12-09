import { MCPClient } from "@mastra/mcp";

export const halterMcp = new MCPClient({
  id: "halter-mcp-client",
  servers: {
    halter: {
      url: new URL(
        "https://mcp-server.preview.dev.halter.io/mcp-19d846fefbf86444774eec724a57bcacc030d9bdb89794261a8cfd4c06a9cf38"
      ),
    },
  },
});

// Cache for MCP tools - initialized once and reused
let toolsCache: Awaited<ReturnType<typeof halterMcp.getTools>> | null = null;
let toolsPromise: Promise<Awaited<ReturnType<typeof halterMcp.getTools>>> | null =
  null;

// Farm summary cache with TTL
let farmSummaryCache: { data: string; timestamp: number } | null = null;
const FARM_SUMMARY_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached MCP tools. On first call, initiates the MCP handshake.
 * Subsequent calls return the cached tools immediately.
 * Uses a promise cache to prevent multiple concurrent initializations.
 */
export async function getCachedTools() {
  if (toolsCache) {
    return toolsCache;
  }

  if (!toolsPromise) {
    toolsPromise = halterMcp.getTools().then((tools) => {
      toolsCache = tools;
      return tools;
    });
  }

  return toolsPromise;
}

/**
 * Get cached farm summary. Returns cached value if within TTL,
 * otherwise fetches fresh data. Falls back to stale cache on error.
 */
export async function getCachedFarmSummary(): Promise<string | null> {
  const now = Date.now();

  // Return cached value if still valid
  if (farmSummaryCache && now - farmSummaryCache.timestamp < FARM_SUMMARY_TTL) {
    return farmSummaryCache.data;
  }

  try {
    const tools = await getCachedTools();
    const result = await tools.halter_get_farm_summary.execute({
      context: { include: [] },
    });

    if (result && !result.isError) {
      const content = result.content?.[0];
      if (content?.type === "text" && content.text) {
        farmSummaryCache = { data: content.text, timestamp: now };
        return content.text;
      }
    }
  } catch {
    // Farm summary fetch failed - return stale cache if available
    if (farmSummaryCache) {
      return farmSummaryCache.data;
    }
  }

  return null;
}

/**
 * Warm up MCP connection and pre-fetch farm summary.
 * Call this at app startup to eliminate cold start latency.
 */
export function warmupMcp() {
  if (!toolsCache && !toolsPromise) {
    console.log("[MCP] Warming up MCP connection...");
    getCachedTools()
      .then(() => {
        console.log("[MCP] MCP tools loaded, fetching farm summary...");
        return getCachedFarmSummary();
      })
      .then(() => {
        console.log("[MCP] Warmup complete (tools + farm summary cached)");
      })
      .catch((err) => {
        console.error("[MCP] Warmup failed:", err);
      });
  }
}
