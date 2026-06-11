import { toFile, type Uploadable } from "openai";
import { getAudioMimeType } from "@/lib/utils";

export interface BuildAudioFileResult {
    file: Uploadable;
    contentType: string;
}

function isOggContainer(audioBuffer: Buffer): boolean {
    if (audioBuffer.length < 4) return false;
    return (
        audioBuffer[0] === 0x4f &&
        audioBuffer[1] === 0x67 &&
        audioBuffer[2] === 0x67 &&
        audioBuffer[3] === 0x53
    );
}

/** Build the `Uploadable` passed to `openai.audio.transcriptions.create`. */
export async function buildAudioFile(
    audioBuffer: Buffer,
    storagePath: string,
    decryptedFilename: string,
): Promise<BuildAudioFileResult> {
    const isOgg = isOggContainer(audioBuffer);

    const ext = isOgg
        ? "ogg"
        : storagePath.split(".").pop()?.toLowerCase() || "mp3";

    const contentType = isOgg ? "audio/ogg" : getAudioMimeType(storagePath);

    const filename = decryptedFilename.match(/\.\w{2,4}$/)
        ? decryptedFilename
        : `${decryptedFilename}.${ext}`;

    const file = await toFile(audioBuffer, filename, { type: contentType });

    return { file, contentType };
}
