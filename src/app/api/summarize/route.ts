import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { logger } from '@/lib/utils';

const client = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  baseURL: process.env.NEXT_PUBLIC_BASE_URL
});

export async function POST(request: Request) {
  try {
    logger.info('[Summarize] Starting summarization request');
    const { messages } = await request.json();

    // 验证 messages 格式
    if (!Array.isArray(messages)) {
      logger.warn('[Summarize] Invalid messages format');
      return NextResponse.json(
        { error: 'Messages must be an array' },
        { status: 400 }
      );
    }

    const systemMessage: ChatCompletionMessageParam = {
      role: "system",
      content: `You are a professional content summarizer. Create a well-structured summary following this format:

📝 OVERVIEW
[Provide a 2-3 sentence overview of the main topic]

🎯 KEY POINTS
• [Key point 1]
• [Key point 2]
• [Key point 3]
[Add more points if necessary]

💡 MAIN INSIGHTS
[List 2-3 main insights or takeaways]

🗣️ NOTABLE QUOTES
"[Include 1-2 significant quotes if present]"

🔍 ADDITIONAL CONTEXT
[Add any important background information or context]

Format the content with:
• Clear section headers with emojis
• Bullet points for easy scanning
• Proper spacing between sections
• Concise but informative points
• Quotation marks for direct quotes`
    };

    const allMessages = [systemMessage, ...messages];
    logger.info('[Summarize] Sending request to OpenAI');

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    logger.info('[Summarize] Received response from OpenAI');
    const summary = response.choices[0]?.message?.content;

    if (!summary) {
      logger.error('[Summarize] No summary generated');
      throw new Error('No summary generated');
    }

    logger.info('[Summarize] Successfully generated summary');
    return NextResponse.json({ summary });
  } catch (error) {
    logger.error('[Summarize] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
