import { createScorer } from "@mastra/core/scores";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

export const qualityScorer = createScorer({
  name: "Farm Assistant Quality",
  description:
    "Evaluates if the assistant provided helpful, accurate, and actionable farming advice",
  judge: {
    model: anthropic("claude-haiku-3-5-20241022"),
    instructions: `You are a quality evaluator for a cattle farming AI assistant powered by Halter technology.

Your job is to identify responses that need improvement. Flag issues like:
- Not using available farm data tools when the question required real data
- Giving vague or generic advice instead of specific, actionable recommendations
- Making up data or statistics instead of using the Halter MCP tools
- Not addressing the farmer's actual question
- Missing obvious follow-up actions or alerts`,
  },
})
  .analyze({
    description: "Analyze the response quality",
    outputSchema: z.object({
      usedToolsAppropriately: z.boolean(),
      wasSpecificAndActionable: z.boolean(),
      answeredTheQuestion: z.boolean(),
      issues: z.array(z.string()),
      suggestions: z.array(z.string()),
    }),
    createPrompt: ({ run }) => {
      const toolCalls = run.output.toolCalls || [];
      const toolsUsed = toolCalls.map((t: { toolName: string }) => t.toolName).join(", ") || "none";

      return `Evaluate this farming assistant interaction:

USER QUESTION:
${run.input}

TOOLS USED:
${toolsUsed}

ASSISTANT RESPONSE:
${run.output.text}

Analyze:
1. Did the assistant use Halter data tools when the question needed real farm data?
2. Was the response specific and actionable (not generic advice)?
3. Did it actually answer what the farmer asked?
4. List any issues that should be flagged for product improvement
5. Suggest how the response could be better`;
    },
  })
  .generateScore(({ results }) => {
    const analysis = results.analyzeStepResult;
    let score = 1.0;

    if (!analysis.usedToolsAppropriately) score -= 0.3;
    if (!analysis.wasSpecificAndActionable) score -= 0.3;
    if (!analysis.answeredTheQuestion) score -= 0.4;

    return Math.max(0, score);
  })
  .generateReason({
    description: "Explain the quality score",
    createPrompt: ({ results, score }) => {
      const analysis = results.analyzeStepResult;
      return `Summarize why this response scored ${score.toFixed(2)}:

Issues found: ${analysis.issues.join("; ") || "None"}
Suggestions: ${analysis.suggestions.join("; ") || "None"}

Write a brief (1-2 sentence) explanation for the product team.`;
    },
  });
