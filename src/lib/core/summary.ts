import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { logger } from '@/lib/utils';
import { createOpenAIClient, OpenAIConfig } from './openai';

export interface SummaryOptions {
  language?: string;
  openaiConfig?: OpenAIConfig;
}

const SUMMARY_SYSTEM_PROMPT = `You are a professional content summarizer. Create a well-structured summary following this format:

OVERVIEW
[2-3 sentences overview]

KEY POINTS
- [Point 1]
- [Point 2]
- [Point 3]

INSIGHTS
[2-3 main insights]

QUOTES
[1-2 significant quotes]

CONTEXT
[Important background info]

Format with:
- Section headers
- Bullet points
- Proper spacing
- Concise but informative
- Quote marks for quotes`;

export async function generateSummary(
  transcript: string,
  options: SummaryOptions = {}
): Promise<string> {
  const { openaiConfig } = options;
  const client = createOpenAIClient(openaiConfig);

  try {
    logger.info('[Summary] Starting summary generation');

    const systemMessage: ChatCompletionMessageParam = {
      role: "system",
      content: SUMMARY_SYSTEM_PROMPT
    };

    const userMessage: ChatCompletionMessageParam = {
      role: "user",
      content: transcript
    };

    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [systemMessage, userMessage],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const summary = response.choices[0]?.message?.content;

    if (!summary) {
      throw new Error('No summary generated');
    }

    logger.info('[Summary] Successfully generated summary');
    return summary;
  } catch (error) {
    logger.error('[Summary] Error:', error);
    throw error;
  }
}
