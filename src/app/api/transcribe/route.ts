import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getExtensionFromMimeType } from '@/lib/audio';

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
          content: `You are a professional transcript formatter. Format the given transcript to make it more readable by:
1. Properly segment paragraphs based on topic changes
2. Add proper punctuation and capitalization
3. Identify and label speakers with their roles (e.g., "Host:", "Guest:", "Expert:")
4. Highlight important contributions with [IMPORTANT] tags
5. Remove filler words and repetitions while maintaining the meaning
6. Format timestamps if mentioned
7. Add section headers for major topic changes
8. Preserve important quotes with quotation marks
9. Mark key insights with [INSIGHT] tags
10. Identify and tag the main speaker's contributions with [MAIN]

Keep the content accurate but make it more structured and readable. Add metadata about speaker roles and importance when possible.`
        },
        {
          role: 'user',
          content: `Please format this transcript:\n\n${text}`
        }
      ]
    });

    return response.choices[0]?.message?.content || text;
  } catch (error) {
    console.error('AI formatting error:', error);
    return text; // 如果AI格式化失败，返回原始文本
  }
}

export async function POST(request: Request) {
  try {
    console.log('[Transcription] Starting transcription request');
    
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log('[Transcription] Received file details:', {
      type: file instanceof Blob ? file.type : typeof file,
      size: file instanceof Blob ? file.size : 'unknown'
    });

    // 检查文件是否可读
    try {
      const arrayBuffer = await (file as Blob).arrayBuffer();
      console.log('[Transcription] Successfully read file to buffer, size:', arrayBuffer.byteLength);
    } catch (error) {
      console.error('[Transcription] Error reading file:', error);
      return NextResponse.json(
        { error: 'Failed to read audio file' },
        { status: 400 }
      );
    }

    console.log('[Transcription] Starting Whisper transcription');
    try {
      const fileType = file instanceof Blob ? file.type : 'audio/mpeg';
      console.log('[Transcription] Audio file type:', fileType);
      const extension = `.${getExtensionFromMimeType(fileType)}`;

      const response = await client.audio.transcriptions.create({
        model: 'whisper-1',
        file: new File([file as Blob], `audio${extension}`, { type: fileType }),
        response_format: "text",
        language: "en"
      });
      console.log('[Transcription] Whisper transcription completed');
      const rawTranscript = typeof response === 'string' ? response : JSON.stringify(response);
      console.log('[Transcription] Raw transcript length:', rawTranscript.length);
      
      // 使用AI格式化转录文本
      console.log('[Transcription] Starting AI formatting');
      const formattedTranscript = await formatWithAI(rawTranscript);
      console.log('[Transcription] AI formatting completed');
      console.log('[Transcription] Formatted transcript length:', formattedTranscript.length);

      return NextResponse.json({ 
        transcript: formattedTranscript 
      });
    } catch (error) {
      console.error('[Transcription] Error:', error);
      return NextResponse.json(
        { error: 'Failed to transcribe audio' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Transcription] Error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
