import { createScorer } from "@mastra/core/scores";

// Thresholds for flagging context usage issues
const THRESHOLDS = {
  totalTokensWarning: 50000, // Flag if total tokens exceed this
  totalTokensCritical: 100000, // Critical if exceeds this
  toolResultSizeWarning: 10000, // Flag if any single tool result is this many chars
  toolCallCountWarning: 10, // Flag if more than N tool calls in one response
};

export const contextUsageScorer = createScorer({
  name: "Context Usage Monitor",
  description:
    "Tracks token usage and tool response sizes to identify interactions that risk context overflow",
})
  .generateScore(({ run }) => {
    const usage = run.output.usage || { promptTokens: 0, completionTokens: 0 };
    const totalTokens = (usage.promptTokens || 0) + (usage.completionTokens || 0);
    const toolCalls = run.output.toolCalls || [];

    // Calculate total tool result size (rough estimate from stringified results)
    let maxToolResultSize = 0;
    let totalToolResultSize = 0;

    for (const call of toolCalls) {
      const resultSize = JSON.stringify(call.result || {}).length;
      totalToolResultSize += resultSize;
      if (resultSize > maxToolResultSize) {
        maxToolResultSize = resultSize;
      }
    }

    // Score from 0-1 where 1 is good (low usage) and 0 is bad (high usage)
    let score = 1.0;

    // Penalize for high token usage
    if (totalTokens > THRESHOLDS.totalTokensCritical) {
      score -= 0.5;
    } else if (totalTokens > THRESHOLDS.totalTokensWarning) {
      score -= 0.25;
    }

    // Penalize for large individual tool results
    if (maxToolResultSize > THRESHOLDS.toolResultSizeWarning) {
      score -= 0.25;
    }

    // Penalize for many tool calls
    if (toolCalls.length > THRESHOLDS.toolCallCountWarning) {
      score -= 0.25;
    }

    return Math.max(0, score);
  })
  .generateReason(({ run, score }) => {
    const usage = run.output.usage || { promptTokens: 0, completionTokens: 0 };
    const totalTokens = (usage.promptTokens || 0) + (usage.completionTokens || 0);
    const toolCalls = run.output.toolCalls || [];

    // Find largest tool results
    const toolSizes = toolCalls.map((call: { toolName: string; result?: unknown }) => ({
      tool: call.toolName,
      size: JSON.stringify(call.result || {}).length,
    }));
    toolSizes.sort((a: { size: number }, b: { size: number }) => b.size - a.size);

    const issues: string[] = [];

    if (totalTokens > THRESHOLDS.totalTokensCritical) {
      issues.push(`CRITICAL: ${totalTokens.toLocaleString()} total tokens used`);
    } else if (totalTokens > THRESHOLDS.totalTokensWarning) {
      issues.push(`WARNING: ${totalTokens.toLocaleString()} total tokens used`);
    }

    if (toolSizes.length > 0 && toolSizes[0].size > THRESHOLDS.toolResultSizeWarning) {
      issues.push(
        `Large tool response: ${toolSizes[0].tool} returned ${toolSizes[0].size.toLocaleString()} chars`
      );
    }

    if (toolCalls.length > THRESHOLDS.toolCallCountWarning) {
      issues.push(`High tool call count: ${toolCalls.length} calls`);
    }

    if (issues.length === 0) {
      return `Context usage OK. Tokens: ${totalTokens.toLocaleString()}, Tool calls: ${toolCalls.length}`;
    }

    return issues.join(". ");
  });
