import { type ClassValue, clsx } from "clsx"
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
