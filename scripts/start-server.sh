#!/bin/bash
# Start the dev server, killing any existing instance first

# Kill any process using port 3001
lsof -ti :3001 | xargs kill -9 2>/dev/null

sleep 1

# Start the dev server
npm run dev
