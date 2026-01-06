import OpenAI from 'openai';
export interface OpenAIConfig {
    apiKey?: string;
    baseURL?: string;
}
export declare function createOpenAIClient(config?: OpenAIConfig): OpenAI;
