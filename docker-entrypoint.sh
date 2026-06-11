#!/bin/sh
set -e

echo "🚀 Starting Riffado..."

echo "⏳ Running database migrations..."
bun migrate-idempotent.js

echo "🚀 Starting application..."
# Start standalone workers in the background
bun webhook-worker.js &
bun transcription-worker.js &

exec "$@"
