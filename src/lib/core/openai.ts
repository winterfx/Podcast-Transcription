import OpenAI from 'openai';

export interface OpenAIConfig {
  apiKey?: string;
  baseURL?: string;
}

export function createOpenAIClient(config?: OpenAIConfig): OpenAI {
  return new OpenAI({
    apiKey: config?.apiKey || process.env.API_KEY,
    baseURL: config?.baseURL || process.env.BASE_URL
  });
}
