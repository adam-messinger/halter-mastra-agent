import { MCPClient } from "@mastra/mcp";

export const halterMcp = new MCPClient({
  id: "halter-mcp-client",
  servers: {
    halter: {
      url: new URL(
        "https://mcp-server.preview.dev.halter.io/mcp-19d846fefbf86444774eec724a57bcacc030d9bdb89794261a8cfd4c06a9cf38"
      ),
    },
  },
});
