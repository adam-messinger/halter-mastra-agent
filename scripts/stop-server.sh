#!/bin/bash
# Stop the dev server

lsof -ti :3001 | xargs kill -9 2>/dev/null

echo "Dev server stopped"
