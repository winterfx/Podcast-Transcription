import { OpenAIConfig } from './openai';
export interface TranscriptionProgress {
    type: 'progress' | 'partial' | 'complete' | 'error';
    message?: string;
    transcript?: string;
    progress?: {
        current: number;
        total: number;
    };
    error?: string;
}
export interface TranscriptionOptions {
    language?: string;
    chunkDuration?: number;
    openaiConfig?: OpenAIConfig;
    onProgress?: (progress: TranscriptionProgress) => void;
}
export declare function transcribeAudio(audioBuffer: Buffer, mimeType: string, options?: TranscriptionOptions): Promise<string>;
export declare function transcribeWithStream(audioBuffer: Buffer, mimeType: string, writer: WritableStreamDefaultWriter<Uint8Array>, encoder: TextEncoder, options?: Omit<TranscriptionOptions, 'onProgress'>): Promise<string>;
