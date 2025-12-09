import { google } from "@ai-sdk/google";
import { createScorer } from "@mastra/core/scores";
import {
  getUserMessageFromRunInput,
  getAssistantMessageFromRunOutput,
} from "@mastra/evals/scorers/utils";
import { z } from "zod";

// Strict scoring schema
const strictAnalysisSchema = z.object({
  intentAlignment: z.object({
    score: z.number().min(0).max(1),
    primaryIntent: z.string(),
    isAddressed: z.boolean(),
    reasoning: z.string(),
  }),
  requirementsFulfillment: z.object({
    requirements: z.array(
      z.object({
        requirement: z.string(),
        isFulfilled: z.boolean(),
        reasoning: z.string(),
      })
    ),
    overallScore: z.number().min(0).max(1),
  }),
  completeness: z.object({
    score: z.number().min(0).max(1),
    missingElements: z.array(z.string()),
    reasoning: z.string(),
  }),
  responseAppropriateness: z.object({
    score: z.number().min(0).max(1),
    formatAlignment: z.boolean(),
    toneAlignment: z.boolean(),
    reasoning: z.string(),
  }),
  overallAssessment: z.string(),
});

// Strict judge instructions - key difference is the scoring guidance
const STRICT_INSTRUCTIONS = `You are a STRICT and CRITICAL prompt-response alignment evaluator. Your job is to rigorously analyze how well an agent's response aligns with the user's prompt.

CRITICAL SCORING RULES - You MUST follow these:

1. **Score 1.0 is RARE** - Only for responses that perfectly, completely, and directly answer the question with no issues whatsoever. Most responses should NOT get 1.0.

2. **Penalize generously**:
   - If ANY explicit requirement is not fulfilled → max 0.7 for that dimension
   - If the response goes off-topic or adds unnecessary content → reduce completeness score
   - If the response is longer than needed → reduce appropriateness score
   - If the response doesn't directly answer the question first → reduce intent score

3. **Be skeptical of "good enough"**:
   - A response that "technically" answers but could be better → 0.6-0.8
   - A response that answers well but has minor issues → 0.8-0.9
   - A response that is truly excellent → 0.9-1.0

4. **Score distribution guidance**:
   - 0.0-0.3: Failed to address the question or majorly wrong
   - 0.4-0.6: Partially addressed, significant gaps or issues
   - 0.7-0.8: Good response with minor issues
   - 0.9-1.0: Excellent response with no meaningful issues

5. **Common deductions**:
   - Doesn't answer the question directly at the start: -0.1 to -0.2
   - Includes irrelevant information: -0.1 per irrelevant section
   - Missing specific data that was asked for: -0.2 to -0.3
   - Overly verbose when brevity was appropriate: -0.1

Remember: Your job is to find issues, not to justify high scores. Be tough but fair.`;

// Create strict scorer using Gemini 3 Pro
export const promptAlignmentScorer = createScorer({
  name: "Strict Prompt Alignment",
  description:
    "Strictly evaluates response alignment with user intent - penalizes issues more heavily",
  type: "agent",
  judge: {
    model: google("gemini-3-pro-preview"),
    instructions: STRICT_INSTRUCTIONS,
  },
})
  .analyze({
    description: "Strictly analyze prompt-response alignment",
    outputSchema: strictAnalysisSchema,
    createPrompt: ({ run }) => {
      const userPrompt = getUserMessageFromRunInput(run.input) ?? "";
      let agentResponse = getAssistantMessageFromRunOutput(run.output) ?? "";

      // Truncate very long responses to improve reliability
      const MAX_RESPONSE_LENGTH = 3000;
      if (agentResponse.length > MAX_RESPONSE_LENGTH) {
        agentResponse =
          agentResponse.slice(0, MAX_RESPONSE_LENGTH) +
          "\n\n[Response truncated for scoring - original was " +
          agentResponse.length +
          " chars]";
      }

      return `Evaluate this agent interaction with STRICT scoring criteria.

USER PROMPT:
${userPrompt}

AGENT RESPONSE:
${agentResponse}

Analyze across four dimensions. Remember: Score 1.0 is RARE. Most good responses should be 0.7-0.9.

For each dimension, provide:
- A score from 0.0 to 1.0 (be strict!)
- Detailed reasoning explaining any deductions

IMPORTANT: Return ONLY valid JSON matching the schema. No markdown code blocks, no extra text.`;
    },
  })
  .generateScore(({ results }) => {
    const analysis = results.analyzeStepResult;
    if (!analysis) return 0;

    // Weighted scoring: Intent (40%), Requirements (30%), Completeness (20%), Appropriateness (10%)
    const weightedScore =
      analysis.intentAlignment.score * 0.4 +
      analysis.requirementsFulfillment.overallScore * 0.3 +
      analysis.completeness.score * 0.2 +
      analysis.responseAppropriateness.score * 0.1;

    return Math.round(weightedScore * 100) / 100;
  })
  .generateReason(({ results, score }) => {
    const analysis = results.analyzeStepResult;
    if (!analysis) return `Score: ${score} - Unable to analyze`;

    return `Score: ${score}

Intent (40%): ${analysis.intentAlignment.score} - ${analysis.intentAlignment.reasoning}
Requirements (30%): ${analysis.requirementsFulfillment.overallScore} - ${analysis.requirementsFulfillment.requirements.map((r) => `${r.requirement}: ${r.isFulfilled ? "✓" : "✗"}`).join(", ")}
Completeness (20%): ${analysis.completeness.score} - ${analysis.completeness.reasoning}
Appropriateness (10%): ${analysis.responseAppropriateness.score} - ${analysis.responseAppropriateness.reasoning}

${analysis.overallAssessment}`;
  });
