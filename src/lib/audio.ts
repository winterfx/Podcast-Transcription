import { logger } from './utils';
import { execSync } from 'child_process';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

// 获取文件扩展名
export function getFileExtension(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase();
  return ext || 'mp3';
}

// 从MIME类型获取文件扩展名
export function getExtensionFromMimeType(type: string): string {
  switch (type) {
    case 'audio/mpeg':
    case 'audio/mp3':
      return 'mp3';
    case 'audio/wav':
    case 'audio/x-wav':
      return 'wav';
    case 'audio/ogg':
      return 'ogg';
    case 'audio/x-m4a':
    case 'audio/m4a':
    case 'audio/mp4':
      return 'm4a';
    case 'video/mp4':
      return 'mp3';
    default:
      logger.warn('[Audio] Unknown audio type:', type);
      return 'mp3';
  }
}

// 从扩展名获取MIME类型
export function getMimeTypeFromExtension(ext: string): string {
  switch (ext) {
    case 'm4a':
      return 'audio/mp4';
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'ogg':
      return 'audio/ogg';
    default:
      return 'audio/mpeg';
  }
}

// 获取或推断MIME类型
export function getMimeType(blob: Blob, url: string): string {
  if (blob.type) return blob.type;
  const ext = getFileExtension(url);
  return getMimeTypeFromExtension(ext);
}
