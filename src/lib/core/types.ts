/**
 * Whisper API verbose_json response types and SRT-related types
 */

// Whisper API verbose_json response segment
export interface WhisperSegment {
  id: number;
  seek: number;
  start: number;  // seconds
  end: number;    // seconds
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

// Whisper API verbose_json response
export interface WhisperVerboseResponse {
  task: string;
  language: string;
  duration: number;
  text: string;
  segments: WhisperSegment[];
}

// SRT subtitle entry
export interface SrtEntry {
  index: number;          // Subtitle index (1-based)
  startTime: number;      // Start time in seconds
  endTime: number;        // End time in seconds
  text: string;           // Subtitle text
}

// Transcription result with optional SRT
export interface TranscriptionResult {
  text: string;           // Plain text transcription
  srt?: string;           // SRT format string
}
