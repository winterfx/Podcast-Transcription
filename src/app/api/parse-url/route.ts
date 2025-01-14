import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { logger } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || !url.includes('xiaoyuzhoufm.com')) {
      return NextResponse.json(
        { error: 'Invalid Xiaoyuzhou URL' },
        { status: 400 }
      );
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // 使用 Promise 来处理音频URL的查找
      const audioUrl = await new Promise<string>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Timeout: Audio URL not found'));
        }, 30000);

        // 监听网络请求
        page.setRequestInterception(true).then(() => {
          page.on('request', (request) => {
            const url = request.url();
            const resourceType = request.resourceType();
            
            if (resourceType === 'media' || resourceType === 'other') {
              const headers = request.headers();
              const contentType = headers['content-type'] || '';
              
              if (
                contentType.includes('audio/') || 
                url.endsWith('.mp3') ||
                url.endsWith('.m4a') ||
                url.endsWith('.aac') ||
                url.includes('/audio/')
              ) {
                logger.info('Found audio URL:', url);
                clearTimeout(timeoutId);
                resolve(url);
              }
            }
            request.continue();
          });

          // 访问页面
          page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 30000
          }).catch(reject);
        });
      });

      return NextResponse.json({ audioUrl });
    } finally {
      await browser.close();
    }
  } catch (error) {
    logger.error('Error parsing Xiaoyuzhou URL:', error);
    return NextResponse.json(
      { error: 'Failed to parse URL' },
      { status: 500 }
    );
  }
}
