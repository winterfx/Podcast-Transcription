import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { logger } from '@/lib/utils';
import { join, extname } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { WhisperVerboseResponse, SrtEntry } from '@/lib/core/types';
import { convertSegmentsToSrtEntries, entriesToSrtString } from '@/lib/core/srt';

// Route Segment Config - 支持大文件上传
export const maxDuration = 300; // 5 分钟超时

const client = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  baseURL: process.env.NEXT_PUBLIC_BASE_URL
});

async function formatWithAI(
  text: string, 
): Promise<string> {
  try {
    const systemPrompt = `You are a transcript formatter. Format the given transcript to make it more readable by:
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
  } catch (error) {
    logger.error('AI formatting error:', error);
    return text; // If AI formatting fails, return the original text
  }
}

export async function POST(
  request: Request
): Promise<Response | NextResponse> {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  try {
    logger.info('[Transcription] Starting transcription request');
    const formData = await request.formData();
    const file = formData.get('file');
    const language = formData.get('language') as string || 'auto';
    const outputFormat = formData.get('outputFormat') as string || 'text';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    logger.info('[Transcription] Received file details:', {
      type: file instanceof Blob ? file.type : typeof file,
      size: file instanceof Blob ? file.size : 'unknown'
    });
    // Better file validation
    if (!file) {
      logger.error('[Transcription] No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Ensure file is a Blob or File
    if (!file || typeof file === 'string' || !(file instanceof Blob)) {
      logger.error('[Transcription] Invalid file format - not a Blob or File');
      return NextResponse.json(
        { error: 'Invalid file format' },
        { status: 400 }
      );
    }


    // Get file extension from filename
    const fileName = file instanceof File ? file.name : 'audio.mp3';
    const fileExtension = extname(fileName) || '.mp3';

    (async () => {
      try {
        const result = await transcribeInChunks(file, fileExtension, writer, encoder, language, outputFormat);

        // Send final result
        await writer.write(
          encoder.encode(JSON.stringify({
            type: 'complete',
            transcript: result.text,
            srt: result.srt
          }) + '\n')
        );
      } catch (error) {
        // Error already handled in transcribeInChunks
        logger.error('[Transcription] Processing failed:', error);
      } finally {
        try {
          await writer.close();
        } catch (closeError) {
          // Ignore close errors
          logger.warn('[Transcription] Error closing writer:', closeError);
        }
      }
    })();

    // Return the stream
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    await writer.close();
    logger.error('[Transcription] Error:', error);
    return NextResponse.json(
      { error: 'Failed to start transcription' },
      { status: 500 }
    );
  }
}

interface TranscribeResult {
  text: string;
  srt?: string;
}

async function transcribeInChunks(
  audioFile: Blob,
  extension: string,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  language: string = 'auto',
  outputFormat: string = 'text',
  chunkDuration: number = 300 // 5 minutes in seconds
): Promise<TranscribeResult> {
  const sessionId = uuidv4();
  const baseDir = join(process.cwd(), 'temp');
  const tempDir = join(baseDir, sessionId);
  const needSrt = outputFormat === 'srt';

  // Ensure extension starts with dot
  const ext = extension.startsWith('.') ? extension : `.${extension}`;

  try {
    const transcriptions: string[] = [];
    const allSrtEntries: SrtEntry[] = [];
    let globalSrtIndex = 1;

    // Create directories recursively
    if (!existsSync(baseDir)) {
      mkdirSync(baseDir, { recursive: true });
    }
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    logger.info(`[Transcription] Created temp directory: ${tempDir}`);

    const inputPath = join(tempDir, `input${ext}`);
    const buffer = await audioFile.arrayBuffer();
    writeFileSync(inputPath, Buffer.from(buffer));

    // Get audio duration using ffprobe
    const durationCmd = `ffprobe -i ${inputPath} -show_entries format=duration -v quiet -of csv="p=0"`;
    const totalDuration = parseFloat(execSync(durationCmd).toString());
    const chunks = Math.ceil(totalDuration / chunkDuration);

    logger.info('[Transcription] Audio details:', {
      duration: totalDuration,
      chunks: chunks,
      outputFormat: outputFormat
    });

    for (let i = 0; i < chunks; i++) {
      const start = i * chunkDuration;
      const outputPath = join(tempDir, `chunk-${i + 1}${ext}`);
      // Split audio using ffmpeg
      const splitCmd = `ffmpeg -i ${inputPath} -ss ${start} -t ${chunkDuration} -c copy ${outputPath}`;
      execSync(splitCmd);

      // Add delay between chunks
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      await writer.write(
        encoder.encode(JSON.stringify({
          type: 'progress',
          message: `Transcribing chunk ${i + 1}/${chunks}...`
        }) + '\n')
      );

      try {
        logger.info(`[Transcription] Starting transcription for chunk ${i + 1}`);

        const chunkBuffer = readFileSync(outputPath);
        // Whisper API识别文件格式通过文件内容，不需要指定type
        const chunkFile = new File([chunkBuffer], `chunk-${i}${ext}`);

        if (needSrt) {
          // Use verbose_json for SRT output to get timestamps
          const response = await client.audio.transcriptions.create({
            model: 'whisper-1',
            file: chunkFile,
            response_format: "verbose_json",
            language: language !== 'auto' ? language : undefined,
            prompt: language === 'auto' ? "如果是中文，请使用简体中文" : undefined
          }) as unknown as WhisperVerboseResponse;

          transcriptions.push(response.text);

          // Convert segments to SRT entries with time offset
          const chunkEntries = convertSegmentsToSrtEntries(
            response.segments,
            i,
            chunkDuration,
            globalSrtIndex
          );
          allSrtEntries.push(...chunkEntries);
          globalSrtIndex += chunkEntries.length;

          const chunkSrt = entriesToSrtString(chunkEntries);

          // For SRT, skip AI formatting to preserve text-timestamp alignment
          await writer.write(
            encoder.encode(JSON.stringify({
              type: 'partial',
              transcript: response.text,
              srt: chunkSrt,
              progress: {
                current: i + 1,
                total: chunks
              }
            }) + '\n')
          );
        } else {
          // Original text-only flow
          let response;
          if (language !== 'auto') {
            response = await client.audio.transcriptions.create({
              model: 'whisper-1',
              file: chunkFile,
              response_format: "text",
              language: language
            });
          } else {
            response = await client.audio.transcriptions.create({
              model: 'whisper-1',
              file: chunkFile,
              response_format: "text",
              prompt: "如果是中文，请使用简体中文"
            });
          }

          const transcription = typeof response === 'string' ? response : JSON.stringify(response);
          transcriptions.push(transcription);

          const formattedChunk = await formatWithAI(transcription);

          await writer.write(
            encoder.encode(JSON.stringify({
              type: 'partial',
              transcript: formattedChunk,
              progress: {
                current: i + 1,
                total: chunks
              }
            }) + '\n')
          );
        }

      } catch (error) {
        logger.error(`[Transcription] Error processing chunk ${i + 1}:`, error);
        throw error;
      }
    }

    const result: TranscribeResult = {
      text: transcriptions.join(' ')
    };

    if (needSrt) {
      result.srt = entriesToSrtString(allSrtEntries);
    }

    return result;
  } catch (error) {
    logger.error('[Transcription] Error:', error);
    throw error;
  } finally {
    // Cleanup temp directory if it exists
    try {
      if (existsSync(tempDir)) {
        execSync(`rm -rf ${tempDir}`);
        logger.info(`[Transcription] Cleaned up temp directory: ${tempDir}`);
      }
    } catch (cleanupError) {
      logger.warn('[Transcription] Error during cleanup:', cleanupError);
    }
  }
}
