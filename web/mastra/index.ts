import { Mastra } from "@mastra/core";
import { PostgresStore } from "@mastra/pg";
import { cattleAssistant } from "./agents/cattle-assistant";

export const mastra = new Mastra({
  agents: { cattleAssistant },
  ...(process.env.POSTGRES_URL && {
    storage: new PostgresStore({
      connectionString: process.env.POSTGRES_URL,
    }),
  }),
});
