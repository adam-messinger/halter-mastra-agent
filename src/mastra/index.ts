import { Mastra } from "@mastra/core";
import {
  DefaultExporter,
  SamplingStrategyType,
} from "@mastra/core/ai-tracing";
import { LibSQLStore } from "@mastra/libsql";
import { cattleAssistant } from "./agents/cattle-assistant";

// LibSQL storage for tracing data
// Use file-based storage locally, in-memory for production (Vercel)
const store = new LibSQLStore({
  url: process.env.VERCEL ? ":memory:" : "file:.mastra/mastra.db",
});

export const mastra = new Mastra({
  agents: { cattleAssistant },
  storage: store,
  observability: {
    // Use named config for full control
    configs: {
      default: {
        serviceName: "halter-farm-assistant",
        sampling: { type: SamplingStrategyType.ALWAYS },
        exporters: [new DefaultExporter()],
      },
    },
  },
});
