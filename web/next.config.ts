import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@mastra/core", "@mastra/mcp", "@mastra/memory", "@mastra/evals", "@mastra/libsql", "@mastra/ai-sdk"],
};

export default nextConfig;
