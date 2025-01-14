import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getExtensionFromMimeType } from '@/lib/audio';
import { logger } from '@/lib/utils';

const client = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  baseURL: process.env.NEXT_PUBLIC_BASE_URL
});

async function formatWithAI(text: string): Promise<string> {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a transcript formatter. Format the given transcript to make it more readable by:
1. Adding basic punctuation and capitalization
2. Keeping the original wording and structure
3. Preserving all content without removing or summarizing anything

Make minimal changes to improve readability while keeping the original meaning and structure intact.`
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

export async function POST(request: Request) {
  try {
    logger.info('[Transcription] Starting transcription request');
    
    const formData = await request.formData();
    const file = formData.get('file');
    
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

    // Check if the file is readable
    try {
      const arrayBuffer = await (file as Blob).arrayBuffer();
      logger.info('[Transcription] Successfully read file to buffer, size:', arrayBuffer.byteLength);
    } catch (error) {
      logger.error('[Transcription] Error reading file:', error);
      return NextResponse.json(
        { error: 'Failed to read audio file' },
        { status: 400 }
      );
    }

    logger.info('[Transcription] Starting Whisper transcription');
    try {
      const fileType = file instanceof Blob ? file.type : 'audio/mpeg';
      logger.info('[Transcription] Audio file type:', fileType);
      const extension = `.${getExtensionFromMimeType(fileType)}`;

      const response = await client.audio.transcriptions.create({
        model: 'whisper-1',
        file: new File([file as Blob], `audio${extension}`, { type: fileType }),
        response_format: "text",
        language: "en"
      });
      logger.info('[Transcription] Whisper transcription completed');
      const rawTranscript = typeof response === 'string' ? response : JSON.stringify(response);
      logger.info('[Transcription] Raw transcript length:', rawTranscript.length);
      
      // Use AI to format the transcript
      logger.info('[Transcription] Starting AI formatting');
      const formattedTranscript = await formatWithAI(rawTranscript);
      logger.info('[Transcription] AI formatting completed');
      logger.info('[Transcription] Formatted transcript length:', formattedTranscript.length);

      return NextResponse.json({ 
        transcript: formattedTranscript 
      });
    } catch (error) {
      logger.error('[Transcription] Error:', error);
      return NextResponse.json(
        { error: 'Failed to transcribe audio' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('[Transcription] Error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
