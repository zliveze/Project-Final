import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface GeminiRequest {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;
    index: number;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  promptFeedback: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly modelName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const apiUrl = this.configService.get<string>('GEMINI_API_URL');
    const modelName = this.configService.get<string>('GEMINI_MODEL_NAME');

    if (!apiKey || !apiUrl || !modelName) {
      this.logger.error('Gemini API configuration is missing');
      throw new Error('Gemini API configuration is missing');
    }

    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.modelName = modelName;
  }

  async generateContent(
    messages: GeminiMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      topK?: number;
    }
  ): Promise<string> {
    try {
      const url = `${this.apiUrl}/models/${this.modelName}:generateContent?key=${this.apiKey}`;
      
      const requestBody: GeminiRequest = {
        contents: messages,
        generationConfig: {
          temperature: options?.temperature || 0.7,
          topK: options?.topK || 40,
          topP: options?.topP || 0.95,
          maxOutputTokens: options?.maxTokens || 2048,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      };

      this.logger.debug(`Sending request to Gemini API: ${url}`);

      const response = await firstValueFrom(
        this.httpService.post<GeminiResponse>(url, requestBody, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 seconds timeout
        })
      );

      if (!response.data.candidates || response.data.candidates.length === 0) {
        throw new Error('No response generated from Gemini API');
      }

      const candidate = response.data.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('Invalid response format from Gemini API');
      }

      const generatedText = candidate.content.parts[0].text;
      this.logger.debug(`Received response from Gemini API: ${generatedText.substring(0, 100)}...`);

      return generatedText;

    } catch (error) {
      this.logger.error(`Error calling Gemini API: ${error.message}`, error.stack);
      
      if (error.response) {
        this.logger.error(`Gemini API Error Response: ${JSON.stringify(error.response.data)}`);
      }
      
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  async generateChatResponse(
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'model'; content: string }> = [],
    systemPrompt?: string
  ): Promise<string> {
    try {
      const messages: GeminiMessage[] = [];

      // Add system prompt if provided
      if (systemPrompt) {
        messages.push({
          role: 'model',
          parts: [{ text: systemPrompt }]
        });
      }

      // Add conversation history
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          parts: [{ text: msg.content }]
        });
      });

      // Add current user message
      messages.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });

      return await this.generateContent(messages, {
        temperature: 0.8,
        maxTokens: 1024,
      });

    } catch (error) {
      this.logger.error(`Error generating chat response: ${error.message}`);
      throw error;
    }
  }

  async streamGenerateContent(
    messages: GeminiMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      topK?: number;
    }
  ): Promise<AsyncGenerator<string, void, unknown>> {
    // Implementation for streaming would go here
    // For now, we'll use the regular generateContent method
    const response = await this.generateContent(messages, options);
    
    async function* generator() {
      yield response;
    }
    
    return generator();
  }
} 