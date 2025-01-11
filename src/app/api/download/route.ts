import { NextResponse } from 'next/server';
import { parseXiaoyuzhouUrl } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 如果是小宇宙链接，解析出音频URL
    let audioUrl = url;
    if (url.includes('xiaoyuzhoufm.com')) {
      console.log('[Download] Parsing Xiaoyuzhou URL');
      audioUrl = await parseXiaoyuzhouUrl(url);
      console.log('[Download] Got audio URL:', audioUrl);
    }else{
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // 获取音频文件
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.statusText}`);
    }

    // 从URL中获取文件名
    const urlParts = new URL(audioUrl).pathname.split('/');
    const filename = urlParts[urlParts.length - 1] || 'audio.mp3';

    // 创建响应流
    const headers = new Headers(response.headers);
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return new NextResponse(response.body, {
      headers,
      status: 200,
    });
  } catch (error) {
    console.error('[Download] Error:', error);
    return NextResponse.json(
      { error: 'Failed to download audio' },
      { status: 500 }
    );
  }
}
