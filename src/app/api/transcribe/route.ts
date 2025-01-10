import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { parseXiaoyuzhouUrl } from '@/lib/utils';

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
    
    let audioFile: File;
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      let audioUrl = body.url;
      
      // 如果是小宇宙链接，解析出音频URL
      if (audioUrl.includes('xiaoyuzhoufm.com')) {
        console.log('[Transcription] Parsing Xiaoyuzhou URL');
        audioUrl = await parseXiaoyuzhouUrl(audioUrl);
        console.log('[Transcription] Got audio URL:', audioUrl);
      }
      
      console.log('[Transcription] Downloading audio from URL:', audioUrl);
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to download audio from URL: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('[Transcription] Downloaded blob:', {
        type: blob.type,
        size: blob.size
      });
      
      // 从 URL 获取文件扩展名
      const extension = audioUrl.split('.').pop() || 'mp3';
      const mimeType = blob.type || `audio/${extension}`;
      
      // 创建一个新的 FormData，保持原始 MIME type
      const formData = new FormData();
      formData.append('file', blob, `audio.${extension}`);
      audioFile = formData.get('file') as File;
      
      console.log('[Transcription] Created audio file:', {
        name: audioFile.name,
        type: audioFile.type,
        size: audioFile.size
      });
    } else {
      const formData = await request.formData();
      audioFile = formData.get('file') as File;
      console.log('[Transcription] Received audio file details:', {
        name: audioFile.name,
        type: audioFile.type,
        size: audioFile.size,
        lastModified: audioFile.lastModified
      });
    }
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' }, { status: 400 }
      );
    }

    // 检查文件是否可读
    try {
      const arrayBuffer = await audioFile.arrayBuffer();
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
      const response = await client.audio.transcriptions.create({
        model: 'whisper-1',
        file: audioFile,
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
