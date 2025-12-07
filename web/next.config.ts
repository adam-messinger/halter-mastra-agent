import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@mastra/core", "@mastra/mcp", "@mastra/ai-sdk"],
};

export default nextConfig;
