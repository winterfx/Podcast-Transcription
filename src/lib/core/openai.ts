import OpenAI from 'openai';

export interface OpenAIConfig {
  apiKey?: string;
  baseURL?: string;
}

export function createOpenAIClient(config?: OpenAIConfig): OpenAI {
  return new OpenAI({
    apiKey: config?.apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    baseURL: config?.baseURL || process.env.NEXT_PUBLIC_BASE_URL || process.env.OPENAI_BASE_URL
  });
}
