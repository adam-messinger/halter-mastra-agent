import { Mastra } from "@mastra/core";
import { cattleAssistant } from "./agents/cattle-assistant";
import { loggingStorage } from "./storage";

export const mastra = new Mastra({
  agents: { cattleAssistant },
  storage: loggingStorage,
});
