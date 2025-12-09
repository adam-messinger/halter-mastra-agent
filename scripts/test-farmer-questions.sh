#!/bin/bash
# Run farmer questions test suite
#
# Usage:
#   ./scripts/test-farmer-questions.sh [options]
#
# Options:
#   --url <url>      Base URL (default: http://localhost:3001)
#   --section <name> Only run questions from a specific section
#   --limit <n>      Only run first n questions
#   --output <file>  Write results to JSON file

cd "$(dirname "$0")/.."
npx tsx scripts/test-questions.ts "$@"
