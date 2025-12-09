import { anthropic } from "@ai-sdk/anthropic";
import { createAnswerRelevancyScorer } from "@mastra/evals/scorers/llm";

// LLM-based scorer: evaluates if responses address the farmer's question
export const answerRelevancyScorer = createAnswerRelevancyScorer({
  model: anthropic("claude-3-5-haiku-20241022"),
});
