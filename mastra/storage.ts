import { InMemoryStore } from "@mastra/core/storage";
import type { ScoreRowData } from "@mastra/core/scores";

/**
 * In-memory storage that logs scorer results to console.
 * Use this for development to see what the scorers are evaluating.
 */
export class LoggingStorage extends InMemoryStore {
  async saveScore(score: ScoreRowData): Promise<{ score: ScoreRowData }> {
    // Log the score to console
    console.log("\n[Scorer Result]", {
      scorer: score.scorerId,
      score: score.score.toFixed(2),
      reason: score.reason?.slice(0, 200),
    });

    // Also log detailed breakdown if available
    if (score.analyzeStepResult) {
      console.log("[Scorer Details]", JSON.stringify(score.analyzeStepResult, null, 2).slice(0, 500));
    }

    return super.saveScore(score);
  }
}

export const loggingStorage = new LoggingStorage();
