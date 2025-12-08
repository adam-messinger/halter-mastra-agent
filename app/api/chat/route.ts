import { createUIMessageStreamResponse } from "ai";
import { toAISdkFormat } from "@mastra/ai-sdk";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { mastra } from "@/mastra";
import { getFarmSummary } from "@/lib/farm-summary-cache";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const agent = mastra.getAgent("cattleAssistant");

  const runtimeContext = new RuntimeContext();

  // Get farm summary from cache on first message of conversation
  if (messages.length === 1) {
    const farmSummary = await getFarmSummary();
    if (farmSummary) {
      runtimeContext.set("farmSummary", farmSummary);
    }
  }
  console.log("RuntimeContext farmSummary:", runtimeContext.get("farmSummary") ? "SET" : "NOT SET");

  const stream = await agent.stream(messages, { runtimeContext });

  return createUIMessageStreamResponse({
    stream: toAISdkFormat(stream, { from: "agent" }),
  });
}
