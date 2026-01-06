import { OpenAIConfig } from './openai';
export interface SummaryOptions {
    language?: string;
    openaiConfig?: OpenAIConfig;
}
export declare function generateSummary(transcript: string, options?: SummaryOptions): Promise<string>;
