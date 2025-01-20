import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let audioUrl = body.url;
    

    if (audioUrl.includes('xiaoyuzhoufm.com')) {
      logger.info('[Audio] Parsing Xiaoyuzhou URL', audioUrl);

      
      const parseResponse = await fetch(`${request.headers.get('origin')}/api/parse-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: audioUrl }),
      });

      if (!parseResponse.ok) {
        const error = await parseResponse.json();
        throw new Error(error.error || 'Failed to parse URL');
      }

      const data = await parseResponse.json();
      audioUrl = data.audioUrl;
      logger.info('[Audio] Got audio URL:', audioUrl);
    }
    
    logger.info('[Audio] Downloading audio from URL:', audioUrl);
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to download audio from URL: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    logger.info('[Audio] Downloaded blob:', {
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
    logger.error('[Audio] Error:', error);
    return NextResponse.json(
      { error: 'Failed to download audio' },
      { status: 500 }
    );
  }
}
