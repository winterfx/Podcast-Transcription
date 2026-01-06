"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribeAudio = transcribeAudio;
exports.transcribeWithStream = transcribeWithStream;
const audio_1 = require("@/lib/audio");
const utils_1 = require("@/lib/utils");
const path_1 = require("path");
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const uuid_1 = require("uuid");
const openai_1 = require("./openai");
async function formatWithAI(client, text, language = 'auto') {
    try {
        const systemPrompt = language === 'en'
            ? `You are a transcript formatter. Format the given English transcript to make it more readable by:
1. Adding basic punctuation and capitalization
2. Keeping the original wording and structure
3. Preserving all content without removing or summarizing anything
4. Keep the original language of the transcript, do not translate

Make minimal changes to improve readability while keeping the original meaning and structure intact.`
            : `You are a transcript formatter. Format the given transcript to make it more readable by:
1. Adding basic punctuation and capitalization
2. Keeping the original wording and structure
3. Preserving all content without removing or summarizing anything
4. Keep the original language of the transcript, do not translate

Make minimal changes to improve readability while keeping the original meaning and structure intact.`;
        const response = await client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: `Please format this transcript:\n\n${text}`
                }
            ]
        });
        return response.choices[0]?.message?.content || text;
    }
    catch (error) {
        utils_1.logger.error('AI formatting error:', error);
        return text;
    }
}
async function transcribeAudio(audioBuffer, mimeType, options = {}) {
    const { language = 'auto', chunkDuration = 300, openaiConfig, onProgress } = options;
    const client = (0, openai_1.createOpenAIClient)(openaiConfig);
    const sessionId = (0, uuid_1.v4)();
    const baseDir = (0, path_1.join)(process.cwd(), 'temp');
    const tempDir = (0, path_1.join)(baseDir, sessionId);
    try {
        const transcriptions = [];
        // Create directories recursively
        if (!(0, fs_1.existsSync)(baseDir)) {
            (0, fs_1.mkdirSync)(baseDir, { recursive: true });
        }
        if (!(0, fs_1.existsSync)(tempDir)) {
            (0, fs_1.mkdirSync)(tempDir, { recursive: true });
        }
        utils_1.logger.info(`[Transcription] Created temp directory: ${tempDir}`);
        const extension = `.${(0, audio_1.getExtensionFromMimeType)(mimeType)}`;
        const inputPath = (0, path_1.join)(tempDir, `input${extension}`);
        (0, fs_1.writeFileSync)(inputPath, audioBuffer);
        // Get audio duration using ffprobe
        const durationCmd = `ffprobe -i ${inputPath} -show_entries format=duration -v quiet -of csv="p=0"`;
        const totalDuration = parseFloat((0, child_process_1.execSync)(durationCmd).toString());
        const chunks = Math.ceil(totalDuration / chunkDuration);
        utils_1.logger.info('[Transcription] Audio details:', {
            duration: totalDuration,
            chunks: chunks
        });
        for (let i = 0; i < chunks; i++) {
            const start = i * chunkDuration;
            const outputPath = (0, path_1.join)(tempDir, `chunk-${i + 1}${extension}`);
            // Split audio using ffmpeg
            const splitCmd = `ffmpeg -i ${inputPath} -ss ${start} -t ${chunkDuration} -c copy ${outputPath}`;
            (0, child_process_1.execSync)(splitCmd);
            // Add delay between chunks
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            onProgress?.({
                type: 'progress',
                message: `Transcribing chunk ${i + 1}/${chunks}...`
            });
            try {
                let response;
                utils_1.logger.info(`[Transcription] Starting transcription for chunk ${i + 1}`);
                const chunkBuffer = (0, fs_1.readFileSync)(outputPath);
                const chunkFile = new File([chunkBuffer], `chunk-${i}${extension}`, { type: mimeType });
                if (language !== 'auto') {
                    response = await client.audio.transcriptions.create({
                        model: 'whisper-1',
                        file: chunkFile,
                        response_format: "text",
                        language: language
                    });
                }
                else {
                    response = await client.audio.transcriptions.create({
                        model: 'whisper-1',
                        file: chunkFile,
                        response_format: "text",
                        prompt: "如果是中文，请使用简体中文"
                    });
                }
                const transcription = typeof response === 'string' ? response : JSON.stringify(response);
                transcriptions.push(transcription);
                const formattedChunk = await formatWithAI(client, transcription, language);
                onProgress?.({
                    type: 'partial',
                    transcript: formattedChunk,
                    progress: {
                        current: i + 1,
                        total: chunks
                    }
                });
            }
            catch (error) {
                utils_1.logger.error(`[Transcription] Error processing chunk ${i + 1}:`, error);
                throw error;
            }
        }
        return transcriptions.join(' ');
    }
    catch (error) {
        utils_1.logger.error('[Transcription] Error:', error);
        throw error;
    }
    finally {
        // Cleanup temp directory if it exists
        try {
            if ((0, fs_1.existsSync)(tempDir)) {
                (0, child_process_1.execSync)(`rm -rf ${tempDir}`);
                utils_1.logger.info(`[Transcription] Cleaned up temp directory: ${tempDir}`);
            }
        }
        catch (cleanupError) {
            utils_1.logger.warn('[Transcription] Error during cleanup:', cleanupError);
        }
    }
}
// Helper for streaming responses (used by API routes)
async function transcribeWithStream(audioBuffer, mimeType, writer, encoder, options = {}) {
    return transcribeAudio(audioBuffer, mimeType, {
        ...options,
        onProgress: async (progress) => {
            await writer.write(encoder.encode(JSON.stringify(progress) + '\n'));
        }
    });
}
//# sourceMappingURL=transcription.js.map