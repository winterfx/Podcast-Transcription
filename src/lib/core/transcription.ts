import OpenAI from 'openai';
import pLimit from 'p-limit';
import { logger } from '@/lib/utils';
import { join, extname } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { createOpenAIClient, OpenAIConfig } from './openai';
import { WhisperVerboseResponse, SrtEntry, TranscriptionResult } from './types';
import { convertSegmentsToSrtEntries, entriesToSrtString } from './srt';

// Maximum concurrent API requests
const MAX_CONCURRENCY = 3;

export interface TranscriptionProgress {
  type: 'progress' | 'partial' | 'complete' | 'error';
  message?: string;
  transcript?: string;
  srt?: string;
  progress?: { current: number; total: number };
  error?: string;
}

export interface TranscriptionOptions {
  language?: string;
  chunkDuration?: number;
  openaiConfig?: OpenAIConfig;
  outputFormat?: 'text' | 'srt';
  onProgress?: (progress: TranscriptionProgress) => void;
}

// Result from transcribing a single chunk
interface ChunkResult {
  index: number;
  text: string;
  srtEntries?: SrtEntry[];
}

// Check if language is Chinese (handles both 'zh' and 'chinese' from Whisper)
function isChinese(lang: string): boolean {
  return lang === 'zh' || lang === 'chinese';
}

async function formatWithAI(
  client: OpenAI,
  text: string,
  language: string = 'auto'
): Promise<string> {
  try {
    let systemPrompt: string;
    if (isChinese(language)) {
      systemPrompt = `你是一个转录文本格式化助手。请格式化给定的中文转录文本，使其更易读：
1. 添加适当的标点符号
2. 保持原始用词和结构
3. 保留所有内容，不要删除或总结任何内容
4. 保持中文，不要翻译

只做最小的改动来提高可读性，同时保持原意和结构不变。`;
    } else if (language === 'en') {
      systemPrompt = `You are a transcript formatter. Format the given English transcript to make it more readable by:
1. Adding basic punctuation and capitalization
2. Keeping the original wording and structure
3. Preserving all content without removing or summarizing anything
4. Keep the original language of the transcript, do not translate

Make minimal changes to improve readability while keeping the original meaning and structure intact.`;
    } else {
      systemPrompt = `You are a transcript formatter. Format the given transcript to make it more readable by:
1. Adding basic punctuation and capitalization
2. Keeping the original wording and structure
3. Preserving all content without removing or summarizing anything
4. Keep the original language of the transcript, do not translate

Make minimal changes to improve readability while keeping the original meaning and structure intact.`;
    }

    const userPrompt = isChinese(language)
      ? `请格式化以下转录文本：\n\n${text}`
      : `Please format this transcript:\n\n${text}`;

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    return response.choices[0]?.message?.content || text;
  } catch (error) {
    logger.error('AI formatting error:', error);
    return text;
  }
}

// Get prompt based on detected language
function getLanguagePrompt(lang: string): string | undefined {
  if (isChinese(lang)) {
    return "以下是普通话的句子。";
  }
  return undefined;
}

// Core transcription logic that works with a file path
async function transcribeFromPath(
  inputPath: string,
  tempDir: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const {
    language = 'auto',
    chunkDuration = 300,
    openaiConfig,
    outputFormat = 'text',
    onProgress
  } = options;

  const client = createOpenAIClient(openaiConfig);
  const extension = extname(inputPath);
  const needSrt = outputFormat === 'srt';
  const isAutoMode = language === 'auto';

  // Get audio duration using ffprobe
  const durationCmd = `ffprobe -i "${inputPath}" -show_entries format=duration -v quiet -of csv="p=0"`;
  const totalDuration = parseFloat(execSync(durationCmd).toString());
  const totalChunks = Math.ceil(totalDuration / chunkDuration);

  logger.info('[Transcription] Audio details:', {
    duration: totalDuration,
    chunks: totalChunks,
    outputFormat: outputFormat,
    concurrency: MAX_CONCURRENCY
  });

  // Step 1: Split all chunks first
  onProgress?.({
    type: 'progress',
    message: `Splitting audio into ${totalChunks} chunks...`
  });

  const chunkPaths: string[] = [];
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkDuration;
    const outputPath = join(tempDir, `chunk-${i + 1}${extension}`);
    const splitCmd = `ffmpeg -i "${inputPath}" -ss ${start} -t ${chunkDuration} -c copy "${outputPath}" -y 2>/dev/null`;
    execSync(splitCmd);
    chunkPaths.push(outputPath);
  }

  logger.info(`[Transcription] Split into ${chunkPaths.length} chunks`);

  // Step 2: Transcribe chunks in parallel with concurrency limit
  const limit = pLimit(MAX_CONCURRENCY);
  let completedCount = 0;

  const transcribeChunk = async (chunkPath: string, index: number): Promise<ChunkResult> => {
    logger.info(`[Transcription] Starting chunk ${index + 1}/${totalChunks}`);

    const chunkBuffer = readFileSync(chunkPath);
    const chunkFile = new File([chunkBuffer], `chunk-${index}${extension}`);

    // Determine language and prompt settings
    // auto mode: no language, no prompt - let Whisper decide
    // specific language: use that language with appropriate prompt
    const langParam = isAutoMode ? undefined : language;
    const promptParam = isAutoMode ? undefined : getLanguagePrompt(language);

    if (needSrt) {
      // Use verbose_json for SRT output to get timestamps
      const response = await client.audio.transcriptions.create({
        model: 'whisper-1',
        file: chunkFile,
        response_format: "verbose_json",
        language: langParam,
        prompt: promptParam
      }) as unknown as WhisperVerboseResponse;

      // Convert segments to SRT entries with time offset
      // Note: globalSrtIndex will be recalculated after sorting
      const chunkEntries = convertSegmentsToSrtEntries(
        response.segments,
        index,
        chunkDuration,
        1 // Temporary index, will be renumbered after sorting
      );

      completedCount++;
      onProgress?.({
        type: 'partial',
        transcript: response.text,
        progress: {
          current: completedCount,
          total: totalChunks
        }
      });

      return {
        index,
        text: response.text,
        srtEntries: chunkEntries
      };
    } else {
      // Text-only flow
      const response = await client.audio.transcriptions.create({
        model: 'whisper-1',
        file: chunkFile,
        response_format: "text",
        language: langParam,
        prompt: promptParam
      });

      const transcription = typeof response === 'string' ? response : JSON.stringify(response);

      // Format with AI (use generic prompt for auto mode)
      const formattedText = await formatWithAI(client, transcription, language);

      completedCount++;
      onProgress?.({
        type: 'partial',
        transcript: formattedText,
        progress: {
          current: completedCount,
          total: totalChunks
        }
      });

      return {
        index,
        text: formattedText
      };
    }
  };

  // Execute all transcriptions with concurrency control
  const results = await Promise.all(
    chunkPaths.map((path, i) => limit(() => transcribeChunk(path, i)))
  );

  // Step 3: Sort results by index and merge
  results.sort((a, b) => a.index - b.index);

  const result: TranscriptionResult = {
    text: results.map(r => r.text).join(' ')
  };

  if (needSrt) {
    // Renumber SRT entries with correct global indices
    const allSrtEntries: SrtEntry[] = [];
    let globalIndex = 1;
    for (const r of results) {
      if (r.srtEntries) {
        for (const entry of r.srtEntries) {
          allSrtEntries.push({
            ...entry,
            index: globalIndex++
          });
        }
      }
    }
    result.srt = entriesToSrtString(allSrtEntries);
  }

  return result;
}

// Transcribe from file path directly (no memory copy)
export async function transcribeAudioFile(
  filePath: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const sessionId = uuidv4();
  const baseDir = join(process.cwd(), 'temp');
  const tempDir = join(baseDir, sessionId);

  try {
    // Create directories recursively
    if (!existsSync(baseDir)) {
      mkdirSync(baseDir, { recursive: true });
    }
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    logger.info(`[Transcription] Created temp directory: ${tempDir}`);

    return await transcribeFromPath(filePath, tempDir, options);
  } catch (error) {
    logger.error('[Transcription] Error:', error);
    throw error;
  } finally {
    // Cleanup temp directory if it exists
    try {
      if (existsSync(tempDir)) {
        execSync(`rm -rf "${tempDir}"`);
        logger.info(`[Transcription] Cleaned up temp directory: ${tempDir}`);
      }
    } catch (cleanupError) {
      logger.warn('[Transcription] Error during cleanup:', cleanupError);
    }
  }
}

// Transcribe from Buffer (copies to temp file first)
export async function transcribeAudio(
  audioBuffer: Buffer,
  extension: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const sessionId = uuidv4();
  const baseDir = join(process.cwd(), 'temp');
  const tempDir = join(baseDir, sessionId);

  // Ensure extension starts with dot
  const ext = extension.startsWith('.') ? extension : `.${extension}`;

  try {
    // Create directories recursively
    if (!existsSync(baseDir)) {
      mkdirSync(baseDir, { recursive: true });
    }
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    logger.info(`[Transcription] Created temp directory: ${tempDir}`);

    const inputPath = join(tempDir, `input${ext}`);
    writeFileSync(inputPath, audioBuffer);

    return await transcribeFromPath(inputPath, tempDir, options);
  } catch (error) {
    logger.error('[Transcription] Error:', error);
    throw error;
  } finally {
    // Cleanup temp directory if it exists
    try {
      if (existsSync(tempDir)) {
        execSync(`rm -rf "${tempDir}"`);
        logger.info(`[Transcription] Cleaned up temp directory: ${tempDir}`);
      }
    } catch (cleanupError) {
      logger.warn('[Transcription] Error during cleanup:', cleanupError);
    }
  }
}

// Helper for streaming responses (used by API routes)
export async function transcribeWithStream(
  audioBuffer: Buffer,
  extension: string,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  options: Omit<TranscriptionOptions, 'onProgress'> = {}
): Promise<TranscriptionResult> {
  return transcribeAudio(audioBuffer, extension, {
    ...options,
    onProgress: async (progress) => {
      await writer.write(
        encoder.encode(JSON.stringify(progress) + '\n')
      );
    }
  });
}

// Re-export types
export type { TranscriptionResult } from './types';
