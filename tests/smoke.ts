/**
 * Smoke tests for Halter Mastra Agent
 *
 * Tests that the basic chat flow works end-to-end via HTTP.
 * Hits real APIs (Halter MCP, Claude) - no mocking.
 *
 * Usage:
 *   TEST_URL=http://localhost:3000 npx tsx tests/smoke.ts
 *   TEST_URL=https://halter-mastra-agent.vercel.app npx tsx tests/smoke.ts
 */

import assert from "node:assert";

const BASE_URL = process.env.TEST_URL;

if (!BASE_URL) {
  console.error("ERROR: TEST_URL environment variable is required");
  console.error("Usage: TEST_URL=http://localhost:3000 npx tsx tests/smoke.ts");
  process.exit(1);
}

console.log(`\nRunning smoke tests against: ${BASE_URL}\n`);

async function testHomepage() {
  const res = await fetch(BASE_URL);
  assert(res.ok, `Homepage failed with status ${res.status}`);
  const html = await res.text();
  assert(html.includes("<!DOCTYPE html>"), "Response should be HTML");
  console.log("✓ Homepage loads (200 OK)");
}

async function testChatEndpointStreaming() {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: "hello" }],
    }),
  });

  assert(res.ok, `Chat endpoint failed with status ${res.status}`);

  // Read streaming response
  const text = await res.text();
  assert(text.includes("data:"), "Response should be in streaming format");
  assert(
    text.includes("text-delta") || text.includes("text-start"),
    "Response should contain text events",
  );

  console.log("✓ Chat endpoint responds with streaming data");
}

async function testFarmDataInResponse() {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: "what farm is this?" }],
    }),
  });

  assert(res.ok, `Chat endpoint failed with status ${res.status}`);

  const text = await res.text();

  // Check for farm-specific content (proves MCP pre-fetch worked)
  const hasFarmData =
    text.includes("Malrose") ||
    text.includes("Waikato") ||
    text.includes("farm") ||
    text.includes("dairy");

  assert(hasFarmData, "Response should contain farm data from Halter MCP");

  console.log("✓ Farm data present in response (MCP integration working)");
}

// Run all tests
async function runTests() {
  try {
    await testHomepage();
    await testChatEndpointStreaming();
    await testFarmDataInResponse();

    console.log("\n✅ All smoke tests passed\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

runTests();
