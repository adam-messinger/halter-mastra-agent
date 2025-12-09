# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Halter Farm Assistant - an AI-powered cattle farming assistant built with the Mastra framework. It provides conversational access to Halter's smart collar system data through an MCP (Model Context Protocol) server, helping farmers with pasture management, cattle health monitoring, and farm operations.

**Note**: This project is a prototype intended to eventually merge into the main Halter webapp (`halter-corp/webapp`).

## Essential Development Commands

```bash
# Development
npm install           # Install dependencies
npm run dev           # Run dev server (http://localhost:3001)

# Code Quality
npm run lint          # Run ESLint
npm run prettier      # Check formatting
npm run prettier:fix  # Fix formatting
npm run build         # Production build (includes type checking)

# Testing
npm run test:smoke:local                    # Smoke tests against localhost
npm run test:smoke                          # Smoke tests (requires TEST_URL env var)
TEST_URL=https://halter-mastra-agent.vercel.app npm run test:smoke  # Test production
```

## Directory Structure

```
src/
├── app/                    # Next.js App Router (routing only)
│   ├── api/chat/          # Chat API endpoint
│   └── page.tsx           # Main page
├── components/
│   ├── assistant-ui/      # Chat UI components (assistant-ui library)
│   └── ui/                # Shadcn UI primitives
├── lib/                   # Utility functions
│   ├── utils.ts           # General utilities (cn helper)
│   └── context-logger.ts  # Tool call and overflow logging
└── mastra/                # Mastra agent configuration
    ├── agents/            # Agent definitions
    │   └── cattle-assistant.ts  # Main assistant agent
    ├── mcp/               # MCP server connections
    │   └── halter.ts      # Halter MCP client
    ├── scorers/           # Response quality scorers
    ├── storage.ts         # Logging storage config
    └── index.ts           # Mastra instance export
```

## Key Architectural Patterns

### 1. Mastra Agent Architecture
- Agent defined in `src/mastra/agents/cattle-assistant.ts`
- Uses Google Gemini 3 Pro as the LLM
- Tools provided via MCP server connection to Halter backend
- Runtime context injects farm summary on first message

### 2. Chat API Flow
- `POST /api/chat` receives messages from assistant-ui
- First message triggers automatic farm summary fetch
- Agent streams responses via `createUIMessageStreamResponse`
- Context overflow errors return friendly 413 response

### 3. UI Components (assistant-ui)
- Using assistant-ui library primitives
- Thread component in `src/components/assistant-ui/thread.tsx`
- Tool execution shows real-time status (running/complete)
- Error handling with "Start fresh" reset button

### 4. MCP Integration
- Halter MCP server provides farm data tools
- Tools fetched once at module load time
- Tool calls logged with result sizes for debugging

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Add your Google API key:
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=your-key-here
   ```
3. Configure Halter MCP server (if testing with real data)

## Common Pitfalls to Avoid

1. **Don't call farm summary tool unnecessarily** - It's pre-fetched on first message
2. **Don't add business logic to `/app/`** - Keep routing thin (matches webapp pattern)
3. **Watch context window limits** - Large tool responses can overflow context
4. **Don't modify assistant-ui internals** - Use primitives as designed

## Tech Stack Reference

- **Framework**: Next.js 16 with App Router
- **AI**: Mastra framework + Google Gemini 3 Pro
- **UI**: assistant-ui + Tailwind CSS + Shadcn
- **MCP**: @mastra/mcp for tool server connections
- **Evaluation**: @mastra/evals for response scoring
- **Deployment**: Vercel
