import { anthropic } from "@ai-sdk/anthropic";
import { createAnswerRelevancyScorer } from "@mastra/evals/scorers/llm";
import {
  createToneScorer,
  createCompletenessScorer,
} from "@mastra/evals/scorers/code";

// LLM-based scorer: evaluates if responses address the farmer's question
export const answerRelevancyScorer = createAnswerRelevancyScorer({
  model: anthropic("claude-3-5-haiku-20241022"),
});

// Code-based scorer: ensures consistent helpful/professional tone
export const toneScorer = createToneScorer({
  referenceTone: "helpful, professional, and knowledgeable",
});

// Code-based scorer: ensures responses address all parts of the question
export const completenessScorer = createCompletenessScorer();
