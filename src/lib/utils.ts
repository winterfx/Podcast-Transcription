import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from "axios"
import * as cheerio from "cheerio"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function parseXiaoyuzhouUrl(url: string): Promise<string> {
  try {
    // 验证小宇宙链接格式
    if (!url.includes('xiaoyuzhoufm.com')) {
      throw new Error('Invalid Xiaoyuzhou URL')
    }

    // 获取页面内容
    const { data } = await axios.get(url)
    const $ = cheerio.load(data)

    // 解析音频URL
    const audioUrl = $('meta[property="og:audio"]').attr('content') || 
                     $('audio source').attr('src')

    if (!audioUrl) {
      throw new Error('Audio URL not found')
    }

    return audioUrl
  } catch (error) {
    console.error('Error parsing Xiaoyuzhou URL:', error)
    throw error
  }
}

export function getMimeType(blob: Blob, filename: string): string {
  // 如果blob已经有type，直接返回
  if (blob.type) {
    return blob.type;
  }

  // 根据文件扩展名判断
  const extension = getFileExtension(filename).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'm4a': 'audio/mp4',
    'ogg': 'audio/ogg',
    'aac': 'audio/aac'
  };

  return mimeTypes[extension] || 'audio/mpeg'; // 默认返回 audio/mpeg
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop() || '';
}
