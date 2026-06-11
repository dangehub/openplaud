import {
    claimDueTranscriptionJobs,
    markJobCompleted,
    releaseOrFailJob,
} from "@/db/queries/transcription-jobs";
import { transcribeRecording } from "@/lib/transcription/transcribe-recording";

const TICK_MS = 10_000; // Scan every 10 seconds
const MAX_RETRIES = 3;

let started = false;
let running = false;

export async function processDueJobs(): Promise<void> {
    if (running) return;
    running = true;

    try {
        let _processedCount = 0;
        let lastBatchSize = 0;

        do {
            const claims = await claimDueTranscriptionJobs();
            lastBatchSize = claims.length;

            for (const { job } of claims) {
                try {
                    // Actual transcription
                    await transcribeRecording(job.userId, job.recordingId);

                    // Mark success
                    await markJobCompleted(job.id, job.userId);
                } catch (error) {
                    const errorMsg =
                        error instanceof Error ? error.message : String(error);
                    console.error(
                        `Transcription job failed for recording ${job.recordingId}:`,
                        errorMsg,
                    );
                    await releaseOrFailJob(job, errorMsg, MAX_RETRIES);
                }
                _processedCount++;
            }
        } while (lastBatchSize > 0);
    } catch (error) {
        console.error("Error in transcription job processor:", error);
    } finally {
        running = false;
    }
}

export function startTranscriptionWorker(): void {
    if (started) return;
    started = true;

    setInterval(() => {
        void processDueJobs();
    }, TICK_MS);

    // Initial run
    void processDueJobs();
}
