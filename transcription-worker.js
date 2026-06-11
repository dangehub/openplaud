/**
 * Transcription worker process.
 * Used when running standalone via `node server.js` or `bun server.js`.
 * Not used in dev (`next dev`); dev relies on `startTranscriptionWorker` imported
 * into the main process in `instrumentation.node.ts` (if configured there).
 */

import { startTranscriptionWorker } from "./src/lib/transcription/worker";

// Log uncaught errors so the process doesn't die silently
process.on("uncaughtException", (err) => {
    console.error("Uncaught exception in transcription worker:", err);
});

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection in transcription worker:", reason);
});

console.log("Starting transcription worker...");
startTranscriptionWorker();
