import { Mastra } from "@mastra/core";
import { VercelDeployer } from "@mastra/deployer-vercel";
import { cattleAssistant } from "./agents/cattle-assistant";

export const mastra = new Mastra({
  agents: { cattleAssistant },
  deployer: new VercelDeployer({
    teamSlug: process.env.VERCEL_TEAM_SLUG,
    projectName: process.env.VERCEL_PROJECT_NAME || "halter-mastra-agent",
    token: process.env.VERCEL_TOKEN,
  }),
});
