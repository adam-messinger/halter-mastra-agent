#!/usr/bin/env npx tsx
/**
 * Tests farmer questions against the chat API and logs results.
 *
 * Usage:
 *   npx tsx scripts/test-questions.ts [options]
 *
 * Options:
 *   --url <url>      Base URL (default: http://localhost:3001)
 *   --section <name> Only run questions from a specific section (e.g., "Health", "Mating")
 *   --limit <n>      Only run first n questions
 *   --output <file>  Write results to JSON file
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface QuestionResult {
  section: string;
  question: string;
  success: boolean;
  responseLength: number;
  toolCalls: string[];
  duration: number;
  error?: string;
  preview?: string;
}

interface TestResults {
  timestamp: string;
  baseUrl: string;
  totalQuestions: number;
  passed: number;
  failed: number;
  results: QuestionResult[];
}

function parseQuestions(
  markdown: string,
): { section: string; question: string }[] {
  const lines = markdown.split("\n");
  const questions: { section: string; question: string }[] = [];
  let currentSection = "General";

  for (const line of lines) {
    const trimmed = line.trim();

    // Section header (## Header)
    if (trimmed.startsWith("## ")) {
      currentSection = trimmed.slice(3).trim();
      continue;
    }

    // Question (- Question text)
    if (trimmed.startsWith("- ")) {
      const question = trimmed.slice(2).trim();
      if (question) {
        questions.push({ section: currentSection, question });
      }
    }
  }

  return questions;
}

async function askQuestion(
  baseUrl: string,
  question: string,
): Promise<{ success: boolean; response: string; error?: string }> {
  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: question }],
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        response: "",
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    // Read streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      return { success: false, response: "", error: "No response body" };
    }

    const decoder = new TextDecoder();
    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullResponse += decoder.decode(value, { stream: true });
    }

    return { success: true, response: fullResponse };
  } catch (error) {
    return {
      success: false,
      response: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function extractToolCalls(response: string): string[] {
  const toolCalls: string[] = [];
  // Look for tool call patterns in the streaming response
  const toolPattern = /"toolName":"([^"]+)"/g;
  let match;
  while ((match = toolPattern.exec(response)) !== null) {
    if (!toolCalls.includes(match[1])) {
      toolCalls.push(match[1]);
    }
  }
  return toolCalls;
}

function extractTextContent(response: string): string {
  // Extract text content from streaming response (data: {...} format)
  const textParts: string[] = [];

  // Look for text-delta events: {"type":"text-delta","id":"0","delta":"text"}
  const textDeltaPattern = /"type":"text-delta"[^}]*"delta":"([^"]*)"/g;
  let match;
  while ((match = textDeltaPattern.exec(response)) !== null) {
    textParts.push(match[1]);
  }

  // Also check for error messages
  const errorPattern = /"type":"error","errorText":"([^"]+)"/;
  const errorMatch = response.match(errorPattern);
  if (errorMatch && textParts.length === 0) {
    // Try to extract just the message from the error JSON
    try {
      const errorJson = JSON.parse(errorMatch[1].replace(/\\"/g, '"').replace(/\\n/g, ' '));
      return `ERROR: ${errorJson.message || errorMatch[1].slice(0, 200)}`;
    } catch {
      return `ERROR: ${errorMatch[1].slice(0, 200)}`;
    }
  }

  return textParts.join("").replace(/\\n/g, "\n");
}

async function main() {
  const args = process.argv.slice(2);

  // Parse args
  let baseUrl = "http://localhost:3001";
  let sectionFilter: string | null = null;
  let limit: number | null = null;
  let outputFile: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--url" && args[i + 1]) {
      baseUrl = args[++i];
    } else if (args[i] === "--section" && args[i + 1]) {
      sectionFilter = args[++i];
    } else if (args[i] === "--limit" && args[i + 1]) {
      limit = parseInt(args[++i], 10);
    } else if (args[i] === "--output" && args[i + 1]) {
      outputFile = args[++i];
    }
  }

  // Load questions
  const mdPath = join(__dirname, "../tests/farmer-questions.md");
  const markdown = readFileSync(mdPath, "utf-8");
  let questions = parseQuestions(markdown);

  console.log(`Loaded ${questions.length} questions from farmer-questions.md`);

  // Apply filters
  if (sectionFilter) {
    questions = questions.filter(
      (q) => q.section.toLowerCase() === sectionFilter!.toLowerCase(),
    );
    console.log(`Filtered to ${questions.length} questions in "${sectionFilter}" section`);
  }

  if (limit) {
    questions = questions.slice(0, limit);
    console.log(`Limited to first ${limit} questions`);
  }

  console.log(`\nTesting against: ${baseUrl}\n`);
  console.log("=".repeat(80));

  const results: QuestionResult[] = [];

  for (let i = 0; i < questions.length; i++) {
    const { section, question } = questions[i];

    console.log(`\n[${i + 1}/${questions.length}] ${section}: ${question}`);

    const startTime = Date.now();
    const { success, response, error } = await askQuestion(baseUrl, question);
    const duration = Date.now() - startTime;

    const toolCalls = extractToolCalls(response);
    const textContent = extractTextContent(response);
    const preview = textContent.slice(0, 200) + (textContent.length > 200 ? "..." : "");

    const result: QuestionResult = {
      section,
      question,
      success,
      responseLength: textContent.length,
      toolCalls,
      duration,
      error,
      preview,
    };

    results.push(result);

    if (success) {
      console.log(`  ✓ ${duration}ms | ${textContent.length} chars | Tools: ${toolCalls.join(", ") || "none"}`);
      console.log(`  Preview: ${preview.slice(0, 100)}...`);
    } else {
      console.log(`  ✗ FAILED: ${error}`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("\nSUMMARY");
  console.log("=".repeat(80));

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Average response time: ${Math.round(avgDuration)}ms`);

  // Tool usage stats
  const toolUsage: Record<string, number> = {};
  for (const r of results) {
    for (const tool of r.toolCalls) {
      toolUsage[tool] = (toolUsage[tool] || 0) + 1;
    }
  }
  console.log("\nTool usage:");
  for (const [tool, count] of Object.entries(toolUsage).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${tool}: ${count}`);
  }

  // Save results
  if (outputFile) {
    const testResults: TestResults = {
      timestamp: new Date().toISOString(),
      baseUrl,
      totalQuestions: results.length,
      passed,
      failed,
      results,
    };
    writeFileSync(outputFile, JSON.stringify(testResults, null, 2));
    console.log(`\nResults saved to: ${outputFile}`);
  }

  // Exit with error code if any failed
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
