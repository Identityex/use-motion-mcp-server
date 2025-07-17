// AI Provider Base Interface
// Abstract base class for all AI providers

import { z } from 'zod';

export interface AIProviderConfig {
  readonly apiKey?: string;
  readonly model: string;
  readonly baseUrl?: string;
  readonly maxTokens?: number;
  readonly temperature?: number;
}

export interface ChatMessage {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
}

export interface GenerationOptions {
  readonly maxTokens?: number;
  readonly temperature?: number;
  readonly topP?: number;
  readonly frequencyPenalty?: number;
  readonly presencePenalty?: number;
}

// Base provider interface that all AI providers must implement
export abstract class BaseAIProvider {
  protected readonly config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  // Generate text completion
  abstract generateText(
    messages: ChatMessage[],
    options?: GenerationOptions
  ): Promise<string>;

  // Generate structured output with schema validation
  abstract generateStructured<T>(
    messages: ChatMessage[],
    schema: z.ZodSchema<T>,
    options?: GenerationOptions
  ): Promise<T>;

  // Count tokens in text (for rate limiting and context management)
  abstract countTokens(text: string): Promise<number>;

  // Check if provider is available and configured
  abstract isAvailable(): Promise<boolean>;

  // Get provider name for logging
  abstract getProviderName(): string;

  // Helper method to build messages
  protected buildMessages(
    systemPrompt: string,
    userPrompt: string,
    context?: string
  ): ChatMessage[] {
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (context) {
      messages.push({ role: 'user', content: `Context: ${context}` });
    }

    messages.push({ role: 'user', content: userPrompt });

    return messages;
  }

  // Helper to validate response against schema
  protected async validateResponse<T>(
    response: string,
    schema: z.ZodSchema<T>
  ): Promise<T> {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response);
      return schema.parse(parsed);
    } catch (error) {
      // If JSON parsing fails, try to extract JSON from markdown code blocks
      const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch && jsonMatch[1]) {
        const extracted = jsonMatch[1].trim();
        const parsed = JSON.parse(extracted);
        return schema.parse(parsed);
      }
      throw new Error(`Failed to parse AI response: ${error}`);
    }
  }
}