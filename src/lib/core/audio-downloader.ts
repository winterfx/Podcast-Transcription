import { logger } from '@/lib/utils';
import { getFileExtension } from '@/lib/audio';

export interface DownloadResult {
  buffer: Buffer;
  extension: string;
}

export async function downloadAudio(url: string): Promise<DownloadResult> {
  logger.info('[AudioDownloader] Downloading audio from URL:', url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Extract extension from URL
  const extension = getFileExtension(url);

  logger.info('[AudioDownloader] Downloaded audio:', {
    size: buffer.length,
    extension
  });

  return {
    buffer,
    extension
  };
}
