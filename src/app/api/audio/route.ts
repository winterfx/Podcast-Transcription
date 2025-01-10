import { NextResponse } from 'next/server';
import { parseXiaoyuzhouUrl } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let audioUrl = body.url;
    
    // 如果是小宇宙链接，解析出音频URL
    if (audioUrl.includes('xiaoyuzhoufm.com')) {
      console.log('[Audio] Parsing Xiaoyuzhou URL');
      audioUrl = await parseXiaoyuzhouUrl(audioUrl);
      console.log('[Audio] Got audio URL:', audioUrl);
    }
    
    console.log('[Audio] Downloading audio from URL:', audioUrl);
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to download audio from URL: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('[Audio] Downloaded blob:', {
      type: blob.type,
      size: blob.size
    });
    

    // Set appropriate headers for the audio response
    const headers = new Headers();
    headers.set('Content-Type', blob.type);
    headers.set('Content-Length', blob.size.toString());
    
    return new NextResponse(blob, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('[Audio] Error:', error);
    return NextResponse.json(
      { error: 'Failed to download audio' },
      { status: 500 }
    );
  }
}
