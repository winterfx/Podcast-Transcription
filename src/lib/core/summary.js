"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSummary = generateSummary;
const utils_1 = require("@/lib/utils");
const openai_1 = require("./openai");
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
async function generateSummary(transcript, options = {}) {
    const { openaiConfig } = options;
    const client = (0, openai_1.createOpenAIClient)(openaiConfig);
    try {
        utils_1.logger.info('[Summary] Starting summary generation');
        const systemMessage = {
            role: "system",
            content: SUMMARY_SYSTEM_PROMPT
        };
        const userMessage = {
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
        utils_1.logger.info('[Summary] Successfully generated summary');
        return summary;
    }
    catch (error) {
        utils_1.logger.error('[Summary] Error:', error);
        throw error;
    }
}
//# sourceMappingURL=summary.js.map