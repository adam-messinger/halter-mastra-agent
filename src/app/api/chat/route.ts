import { createUIMessageStreamResponse } from "ai";
import { toAISdkFormat } from "@mastra/ai-sdk";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { mastra } from "@/mastra";
import { getCachedFarmSummary, warmupMcp } from "@/mastra/mcp/halter";
import {
  resetToolCallLog,
  logToolCall,
  logContextOverflow,
  isContextOverflowError,
} from "@/lib/context-logger";

export const maxDuration = 60;

// Warm up MCP connection + farm summary on module load (eliminates cold start)
warmupMcp();

export async function POST(req: Request) {
  const { messages } = await req.json();
  const agent = mastra.getAgent("cattleAssistant");

  const runtimeContext = new RuntimeContext();

  // Reset tool call tracking for this conversation
  resetToolCallLog();

  // Fetch farm summary on first message (uses cache)
  if (messages.length === 1) {
    const farmSummary = await getCachedFarmSummary();
    if (farmSummary) {
      runtimeContext.set("farmSummary", farmSummary);
    }
  }

  try {
    const stream = await agent.stream(messages, {
      runtimeContext,
      onStepFinish: (stepResult) => {
        // Log tool calls and their result sizes
        if (stepResult.toolCalls?.length > 0) {
          stepResult.toolCalls.forEach((call, i) => {
            const result = stepResult.toolResults?.[i];
            logToolCall(
              call.payload.toolName,
              call.payload.args,
              result?.payload?.result,
            );
          });
        }
      },
    });

    return createUIMessageStreamResponse({
      stream: toAISdkFormat(stream, { from: "agent" }),
    });
  } catch (error) {
    // Log context overflow errors with full conversation details
    if (isContextOverflowError(error)) {
      logContextOverflow(error as Error, messages);
    }
    throw error;
  }
}
