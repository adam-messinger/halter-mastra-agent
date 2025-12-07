import { Mastra } from "@mastra/core";
import { cattleAssistant } from "./agents/cattle-assistant";

export const mastra = new Mastra({
  agents: { cattleAssistant },
});
