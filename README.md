# Halter Farm Assistant

An AI-powered cattle farming assistant built with [Mastra](https://mastra.ai/) and [assistant-ui](https://github.com/Yonom/assistant-ui). Provides conversational access to Halter's smart collar system data, helping farmers with pasture management, cattle health monitoring, and farm operations.

## Requirements

- Node.js 18+
- npm
- Google AI API key (for Gemini)

## Getting Started

Install dependencies:

```bash
npm install
```

Create an `.env.local` file with your API key:

```bash
cp .env.example .env.local
```

Add your Google Generative AI API key to `.env.local`:

```
GOOGLE_GENERATIVE_AI_API_KEY=your-key-here
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the assistant.

## Commands

| Name | Description |
| ---- | ----------- |
| `dev` | Run the project in dev mode |
| `build` | Create a production build |
| `start` | Run a previously created production build |
| `lint` | Run ESLint |
| `prettier` | Check code formatting |
| `prettier:fix` | Fix code formatting |
| `test:smoke` | Run HTTP smoke tests (requires TEST_URL) |
| `test:smoke:local` | Run smoke tests against localhost |

## Architecture

This project uses:

- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[Mastra](https://mastra.ai/)** - AI agent framework with MCP support
- **[Google Gemini](https://ai.google.dev/)** - LLM for the assistant
- **[assistant-ui](https://www.assistant-ui.com/)** - Chat UI components
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[Shadcn UI](https://ui.shadcn.com/)** - UI primitives

## Project Structure

```
src/
├── app/           # Next.js routing and API
├── components/    # React components
├── lib/           # Utilities
└── mastra/        # Agent configuration and MCP
```

See [CLAUDE.md](CLAUDE.md) for detailed architecture documentation.

## Testing

Run smoke tests against local development server:

```bash
npm run dev  # In one terminal
npm run test:smoke:local  # In another terminal
```

Run smoke tests against production:

```bash
TEST_URL=https://halter-mastra-agent.vercel.app npm run test:smoke
```

## Deployment

This project is deployed on [Vercel](https://vercel.com). Push to `master` to trigger a production deployment.
