/**
 * Logs chat conversations with tool call details when context limits are exceeded.
 * Writes to a local file for debugging context bloat issues.
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

interface ToolCallLog {
  toolName: string;
  args: unknown;
  resultSize: number;
  resultPreview: string;
}

interface ContextOverflowLog {
  timestamp: string;
  error: string;
  messageCount: number;
  messages: unknown[];
  toolCalls: ToolCallLog[];
  totalToolResultSize: number;
}

const LOG_DIR = ".context-logs";

// Track tool calls during a conversation
let currentToolCalls: ToolCallLog[] = [];

export function resetToolCallLog() {
  currentToolCalls = [];
}

export function logToolCall(
  toolName: string,
  args: unknown,
  result: unknown,
): void {
  const resultStr = JSON.stringify(result);
  currentToolCalls.push({
    toolName,
    args,
    resultSize: resultStr.length,
    resultPreview:
      resultStr.length > 500 ? resultStr.slice(0, 500) + "..." : resultStr,
  });
}

export function logContextOverflow(
  error: Error | string,
  messages: unknown[],
): void {
  // Only log in development
  if (process.env.NODE_ENV === "production") {
    console.error("[Context Overflow]", error);
    return;
  }

  const log: ContextOverflowLog = {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error),
    messageCount: messages.length,
    messages,
    toolCalls: currentToolCalls,
    totalToolResultSize: currentToolCalls.reduce(
      (sum, tc) => sum + tc.resultSize,
      0,
    ),
  };

  // Ensure log directory exists
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }

  const filename = `context-overflow-${Date.now()}.json`;
  const filepath = join(LOG_DIR, filename);

  writeFileSync(filepath, JSON.stringify(log, null, 2));
  console.error(`[Context Overflow] Logged to ${filepath}`);
  console.error(`  - Messages: ${log.messageCount}`);
  console.error(`  - Tool calls: ${log.toolCalls.length}`);
  console.error(
    `  - Total tool result size: ${(log.totalToolResultSize / 1024).toFixed(1)}KB`,
  );

  // Log the biggest offenders
  const sorted = [...log.toolCalls].sort(
    (a, b) => b.resultSize - a.resultSize,
  );
  if (sorted.length > 0) {
    console.error("  - Largest tool results:");
    sorted.slice(0, 3).forEach((tc) => {
      console.error(
        `    - ${tc.toolName}: ${(tc.resultSize / 1024).toFixed(1)}KB`,
      );
    });
  }
}

// Check if an error looks like a context overflow
export function isContextOverflowError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("context") ||
    msg.includes("token") ||
    msg.includes("too long") ||
    msg.includes("maximum") ||
    msg.includes("limit") ||
    msg.includes("exceeded")
  );
}
