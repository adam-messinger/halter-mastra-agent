#!/bin/bash
# Query the LibSQL traces database
# Usage: ./scripts/query-traces.sh "SELECT * FROM evals LIMIT 10"

if [ -z "$1" ]; then
  echo "Usage: $0 \"SQL QUERY\""
  echo "Example: $0 \"SELECT * FROM evals ORDER BY created_at DESC LIMIT 10\""
  exit 1
fi

sqlite3 .mastra/output/mastra.db "$1"
