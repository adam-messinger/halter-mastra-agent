import { createUIMessageStreamResponse } from "ai";
import { toAISdkFormat } from "@mastra/ai-sdk";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { mastra } from "@/src/mastra";
import { halterMcp } from "@/src/mastra/mcp/halter";
import {
  resetToolCallLog,
  logToolCall,
  logContextOverflow,
  isContextOverflowError,
} from "@/lib/context-logger";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const agent = mastra.getAgent("cattleAssistant");

  const runtimeContext = new RuntimeContext();

  // Reset tool call tracking for this conversation
  resetToolCallLog();

  // Fetch farm summary on first message of conversation
  if (messages.length === 1) {
    try {
      const tools = await halterMcp.getTools();
      const result = await tools.halter_get_farm_summary.execute({
        context: { include: [] },
      });

      if (result && !result.isError) {
        const content = result.content?.[0];
        if (content?.type === "text" && content.text) {
          runtimeContext.set("farmSummary", content.text);
        }
      }
    } catch {
      // Farm summary fetch failed - agent will work without pre-loaded context
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
      onFinish: (result) => {
        // Log token usage
        if (result.usage) {
          console.log("[Agent] Token usage:", result.usage);
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
      // Return a user-friendly error response
      return new Response(
        JSON.stringify({
          error: "context_overflow",
          message:
            "This conversation has grown too long. Please start a fresh chat to continue.",
        }),
        {
          status: 413,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    throw error;
  }
}
