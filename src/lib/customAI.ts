import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

class CustomAI {
  async createTranscription(audioData: File | Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', audioData);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      return data.transcript;
    } catch (error) {
      console.error('Error in createTranscription:', error);
      throw error;
    }
  }

  async createChatCompletion(messages: ChatCompletionMessageParam[]): Promise<string> {
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error('Summary generation failed');
      }

      const data = await response.json();
      return data.summary;
    } catch (error) {
      console.error('Error in createChatCompletion:', error);
      throw error;
    }
  }
}

export const customAI = new CustomAI();
