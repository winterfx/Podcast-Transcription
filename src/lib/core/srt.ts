/**
 * SRT format conversion utilities
 */

import { WhisperSegment, SrtEntry } from './types';

/**
 * Convert seconds to SRT time format (HH:MM:SS,mmm)
 */
export function formatSrtTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.round((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`;
}

/**
 * Convert Whisper segments to SRT entries with time offset applied
 * @param segments - Whisper verbose_json segments
 * @param chunkIndex - Current chunk index (0-based)
 * @param chunkDuration - Duration of each chunk in seconds
 * @param startIndex - Starting SRT index (1-based)
 */
export function convertSegmentsToSrtEntries(
  segments: WhisperSegment[],
  chunkIndex: number,
  chunkDuration: number,
  startIndex: number
): SrtEntry[] {
  const timeOffset = chunkIndex * chunkDuration;

  return segments.map((segment, i) => ({
    index: startIndex + i,
    startTime: segment.start + timeOffset,
    endTime: segment.end + timeOffset,
    text: segment.text.trim()
  }));
}

/**
 * Convert SRT entries array to SRT format string
 */
export function entriesToSrtString(entries: SrtEntry[]): string {
  return entries.map(entry =>
    `${entry.index}\n${formatSrtTime(entry.startTime)} --> ${formatSrtTime(entry.endTime)}\n${entry.text}\n`
  ).join('\n');
}
