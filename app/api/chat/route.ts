import { createUIMessageStreamResponse } from "ai";
import { toAISdkFormat } from "@mastra/ai-sdk";
import { mastra } from "@/mastra";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const agent = mastra.getAgent("cattleAssistant");
  const stream = await agent.stream(messages);

  return createUIMessageStreamResponse({
    stream: toAISdkFormat(stream, { from: "agent" }),
  });
}
