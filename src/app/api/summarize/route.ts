import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const client = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  baseURL: process.env.NEXT_PUBLIC_BASE_URL
});

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    // 验证 messages 格式
    if (!Array.isArray(messages)) {
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

    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        systemMessage,
        ...(messages.map(msg => ({
          role: msg.role || 'user',
          content: msg.content || ''
        })) as ChatCompletionMessageParam[])
      ],
      temperature: 0.3,
      max_tokens: 800,
      presence_penalty: 0.1,
      frequency_penalty: 0.3
    });

    return NextResponse.json({ 
      summary: response.choices[0].message.content 
    });
  } catch (error) {
    console.error('Summarization error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
