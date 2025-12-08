import { createUIMessageStreamResponse } from "ai";
import { toAISdkFormat } from "@mastra/ai-sdk";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { mastra } from "@/mastra";
import { halterMcp } from "@/mastra/mcp/halter";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const agent = mastra.getAgent("cattleAssistant");

  const runtimeContext = new RuntimeContext();

  // Fetch farm summary on first message of conversation
  if (messages.length === 1) {
    try {
      const tools = await halterMcp.getTools();
      console.log("Available tools:", Object.keys(tools));
      const result = await tools.halter_get_farm_summary.execute({ context: { include: [] } });
      console.log("Farm summary result:", result);
      if (result && !result.isError) {
        // Extract text content from MCP response
        const content = result.content?.[0];
        if (content?.type === "text" && content.text) {
          runtimeContext.set("farmSummary", content.text);
        }
      } else {
        console.error("Farm summary returned error:", result);
      }
    } catch (error) {
      console.error("Failed to fetch farm summary:", error);
    }
  }
  console.log("RuntimeContext farmSummary:", runtimeContext.get("farmSummary") ? "SET" : "NOT SET");

  const stream = await agent.stream(messages, { runtimeContext });

  return createUIMessageStreamResponse({
    stream: toAISdkFormat(stream, { from: "agent" }),
  });
}
