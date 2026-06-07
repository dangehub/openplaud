import { and, eq, isNull } from "drizzle-orm";
import { OpenAI } from "openai";
import { db } from "@/db";
import {
    aiEnhancements,
    apiCredentials,
    recordings,
    transcriptions,
    userSettings,
} from "@/db/schema";
import {
    getAiOutputLanguageDirective,
    getDefaultSummaryPromptConfig,
    getSummaryPromptById,
    type SummaryPromptConfiguration,
} from "@/lib/ai/summary-presets";
import { decrypt } from "@/lib/encryption";
import {
    decryptJsonField,
    decryptText,
    encryptJsonField,
    encryptText,
} from "@/lib/encryption/fields";
import { AppError, ErrorCode } from "@/lib/errors";
import { emitEvent } from "@/lib/webhooks/emit";

export async function generateSummaryForRecording(
    userId: string,
    recordingId: string,
    presetId?: string,
) {
    const [recording] = await db
        .select()
        .from(recordings)
        .where(
            and(
                eq(recordings.id, recordingId),
                eq(recordings.userId, userId),
                isNull(recordings.deletedAt),
            ),
        )
        .limit(1);

    if (!recording) {
        throw new AppError(
            ErrorCode.RECORDING_NOT_FOUND,
            "Recording not found",
            404,
        );
    }

    const [transcription] = await db
        .select()
        .from(transcriptions)
        .where(
            and(
                eq(transcriptions.recordingId, recordingId),
                eq(transcriptions.userId, userId),
            ),
        )
        .limit(1);

    if (!transcription) {
        throw new AppError(
            ErrorCode.INVALID_INPUT,
            "No transcription available. Transcribe the recording first.",
            400,
        );
    }

    const [userSettingsRow] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);

    let promptConfig: SummaryPromptConfiguration =
        getDefaultSummaryPromptConfig();
    if (userSettingsRow?.summaryPrompt) {
        const config =
            decryptJsonField<SummaryPromptConfiguration>(
                userSettingsRow.summaryPrompt,
            ) ?? getDefaultSummaryPromptConfig();
        promptConfig = {
            selectedPrompt: config.selectedPrompt || "general",
            customPrompts: config.customPrompts || [],
        };
    }

    const selectedPreset = presetId || promptConfig.selectedPrompt || "general";
    let promptTemplate = getSummaryPromptById(selectedPreset, promptConfig);

    if (!promptTemplate) {
        const defaultConfig = getDefaultSummaryPromptConfig();
        promptTemplate = getSummaryPromptById(
            defaultConfig.selectedPrompt,
            defaultConfig,
        );
        if (!promptTemplate) {
            throw new AppError(
                ErrorCode.INTERNAL_ERROR,
                "Failed to load summary prompt",
                500,
            );
        }
    }

    const [enhancementCredentials] = await db
        .select()
        .from(apiCredentials)
        .where(
            and(
                eq(apiCredentials.userId, userId),
                eq(apiCredentials.isDefaultEnhancement, true),
            ),
        )
        .limit(1);

    const [transcriptionCredentials] = await db
        .select()
        .from(apiCredentials)
        .where(
            and(
                eq(apiCredentials.userId, userId),
                eq(apiCredentials.isDefaultTranscription, true),
            ),
        )
        .limit(1);

    const credentials = enhancementCredentials || transcriptionCredentials;

    if (!credentials) {
        throw new AppError(
            ErrorCode.AI_PROVIDER_NOT_CONFIGURED,
            "No AI provider configured",
            400,
        );
    }

    const apiKey = decrypt(credentials.apiKey);

    const openai = new OpenAI({
        apiKey,
        baseURL: credentials.baseUrl || undefined,
    });

    let model = credentials.defaultModel || "gpt-4o-mini";
    if (model.includes("whisper")) {
        const baseUrl = credentials.baseUrl || "";
        if (baseUrl.includes("groq")) {
            model = "llama-3.1-8b-instant";
        } else if (baseUrl.includes("together")) {
            model = "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo";
        } else if (baseUrl.includes("openrouter")) {
            model = "openai/gpt-4o-mini";
        } else {
            model = "gpt-4o-mini";
        }
    }

    const transcriptText = decryptText(transcription.text);

    const maxLength = 8000;
    const truncatedTranscription =
        transcriptText.length > maxLength
            ? `${transcriptText.substring(0, maxLength)}...`
            : transcriptText;

    const languageDirective = getAiOutputLanguageDirective(
        userSettingsRow?.aiOutputLanguage ?? null,
    );

    const prompt = promptTemplate.replace(
        "{transcription}",
        truncatedTranscription,
    );

    const baseSystem =
        "You are a helpful assistant that summarizes audio transcriptions. Always respond with valid JSON only, no markdown formatting or code fences.";
    const systemContent = languageDirective
        ? `${baseSystem} ${languageDirective}`
        : baseSystem;

    let rawContent = "";
    try {
        const response = await openai.chat.completions.create({
            model,
            messages: [
                {
                    role: "system",
                    content: systemContent,
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.5,
            max_tokens: 2000,
        });
        rawContent = response.choices[0]?.message?.content?.trim() || "";
    } catch (error) {
        await emitEvent("summary.failed", userId, recordingId, {
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }

    let summary = "";
    let keyPoints: string[] = [];
    let actionItems: string[] = [];

    try {
        const cleanContent = rawContent
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();
        const parsed = JSON.parse(cleanContent);
        summary = parsed.summary || "";
        keyPoints = Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [];
        actionItems = Array.isArray(parsed.actionItems)
            ? parsed.actionItems
            : [];
    } catch {
        summary = rawContent;
    }

    const RECORDING_TOMBSTONED = Symbol("recording-tombstoned");
    try {
        await db.transaction(async (tx) => {
            const [stillActive] = await tx
                .select({ deletedAt: recordings.deletedAt })
                .from(recordings)
                .where(
                    and(
                        eq(recordings.id, recordingId),
                        eq(recordings.userId, userId),
                    ),
                )
                .for("update")
                .limit(1);

            if (!stillActive || stillActive.deletedAt) {
                throw RECORDING_TOMBSTONED;
            }

            const [existing] = await tx
                .select()
                .from(aiEnhancements)
                .where(
                    and(
                        eq(aiEnhancements.recordingId, recordingId),
                        eq(aiEnhancements.userId, userId),
                    ),
                )
                .limit(1);

            const encryptedSummary = encryptText(summary);
            const encryptedKeyPoints = encryptJsonField(keyPoints);
            const encryptedActionItems = encryptJsonField(actionItems);

            if (existing) {
                await tx
                    .update(aiEnhancements)
                    .set({
                        summary: encryptedSummary,
                        keyPoints: encryptedKeyPoints,
                        actionItems: encryptedActionItems,
                        provider: credentials.provider,
                        model,
                    })
                    .where(
                        and(
                            eq(aiEnhancements.id, existing.id),
                            eq(aiEnhancements.userId, userId),
                        ),
                    );
            } else {
                await tx.insert(aiEnhancements).values({
                    recordingId: recordingId,
                    userId: userId,
                    summary: encryptedSummary,
                    keyPoints: encryptedKeyPoints,
                    actionItems: encryptedActionItems,
                    provider: credentials.provider,
                    model,
                });
            }

            await tx
                .update(recordings)
                .set({ updatedAt: new Date() })
                .where(
                    and(
                        eq(recordings.id, recordingId),
                        eq(recordings.userId, userId),
                        isNull(recordings.deletedAt),
                    ),
                );
        });
    } catch (txError) {
        if (txError === RECORDING_TOMBSTONED) {
            throw new AppError(
                ErrorCode.NOT_FOUND,
                "Recording was deleted",
                410,
            );
        }
        throw txError;
    }

    await emitEvent("summary.completed", userId, recordingId);

    return {
        summary,
        keyPoints,
        actionItems,
        provider: credentials.provider,
        model,
    };
}
