import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@mastra/core",
    "@mastra/mcp",
    "@mastra/ai-sdk",
    "@mastra/memory",
    "@mastra/pg",
  ],
};

export default nextConfig;
