import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from "axios"
import * as cheerio from "cheerio"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const logger = {
  info: (...args: any[]) => {
    const time = new Date().toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
    console.log(`[${time}]`, ...args);
  },
  error: (...args: any[]) => {
    const time = new Date().toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
    console.error(`[${time}]`, ...args);
  },
  warn: (...args: any[]) => {
    const time = new Date().toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
    console.warn(`[${time}]`, ...args);
  }
};

export async function parseXiaoyuzhouUrl(url: string): Promise<string> {
  try {
    // 验证小宇宙链接格式
    if (!url.includes('xiaoyuzhoufm.com')) {
      throw new Error('Invalid Xiaoyuzhou URL');
    }

    // 获取页面内容
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // 查找音频链接
    const audioUrl = $('audio source').attr('src');
    if (!audioUrl) {
      throw new Error('Audio URL not found');
    }

    return audioUrl
  } catch (error) {
    logger.error('Error parsing Xiaoyuzhou URL:', error)
    throw error
  }
}
