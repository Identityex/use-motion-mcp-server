// Anthropic Provider
// Implements AI functionality using Anthropic's Claude models

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { BaseAIProvider, ChatMessage, GenerationOptions, AIProviderConfig } from './base-provider.js';

export class AnthropicProvider extends BaseAIProvider {
  private client: Anthropic | null = null;

  constructor(config: AIProviderConfig) {
    super(config);
    
    if (config.apiKey) {
      this.client = new Anthropic({
        apiKey: config.apiKey,
        baseURL: config.baseUrl,
      });
    }
  }

  async generateText(
    messages: ChatMessage[],
    options?: GenerationOptions
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Anthropic client not initialized. Please provide an API key.');
    }

    try {
      // Convert messages to Anthropic format
      const { system, anthropicMessages } = this.convertMessages(messages);

      const response = await this.client.messages.create({
        model: this.config.model,
        messages: anthropicMessages,
        system,
        max_tokens: options?.maxTokens || this.config.maxTokens || 2000,
        temperature: options?.temperature || this.config.temperature || 0.7,
        top_p: options?.topP || 1,
      });

      // Extract text from response
      const content = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as any).text)
        .join('\n');

      if (!content) {
        throw new Error('No content received from Anthropic');
      }

      return content;
    } catch (error: any) {
      throw new Error(`Anthropic generation failed: ${error.message}`);
    }
  }

  async generateStructured<T>(
    messages: ChatMessage[],
    schema: z.ZodSchema<T>,
    options?: GenerationOptions
  ): Promise<T> {
    if (!this.client) {
      throw new Error('Anthropic client not initialized. Please provide an API key.');
    }

    // Add instruction to return JSON
    const structuredMessages = [...messages];
    const lastMessage = structuredMessages[structuredMessages.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
      structuredMessages[structuredMessages.length - 1] = {
        role: lastMessage.role,
        content: `${lastMessage.content}\n\nReturn your response as valid JSON that matches this schema:\n${this.schemaToDescription(schema)}\n\nIMPORTANT: Return ONLY valid JSON, no additional text or markdown formatting.`,
      };
    }

    try {
      const { system, anthropicMessages } = this.convertMessages(structuredMessages);

      const response = await this.client.messages.create({
        model: this.config.model,
        messages: anthropicMessages,
        system,
        max_tokens: options?.maxTokens || this.config.maxTokens || 2000,
        temperature: options?.temperature || this.config.temperature || 0.7,
        top_p: options?.topP || 1,
      });

      // Extract text from response
      const content = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as any).text)
        .join('\n');

      if (!content) {
        throw new Error('No content received from Anthropic');
      }

      return await this.validateResponse(content, schema);
    } catch (error: any) {
      throw new Error(`Anthropic structured generation failed: ${error.message}`);
    }
  }

  async countTokens(text: string): Promise<number> {
    if (!this.client) {
      // Fallback to approximation
      return Math.ceil(text.length / 4);
    }

    try {
      // Anthropic's token counting
      // Note: This is an approximation as Anthropic doesn't provide a direct token counter
      // Claude typically uses ~3-4 characters per token
      return Math.ceil(text.length / 3.5);
    } catch (error) {
      return Math.ceil(text.length / 4);
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      // Try a simple API call to check availability
      await this.client.messages.create({
        model: this.config.model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      });
      return true;
    } catch (error) {
      // If it's a rate limit or auth error, the client is available
      const errorMessage = (error as any).message || '';
      if (errorMessage.includes('rate') || errorMessage.includes('auth')) {
        return true;
      }
      return false;
    }
  }

  getProviderName(): string {
    return `Anthropic (${this.config.model})`;
  }

  // Convert generic messages to Anthropic format
  private convertMessages(messages: ChatMessage[]): {
    system: string | undefined;
    anthropicMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  } {
    let system: string | undefined;
    const anthropicMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    for (const message of messages) {
      if (message.role === 'system') {
        // Combine multiple system messages
        system = system ? `${system}\n\n${message.content}` : message.content;
      } else if (message.role === 'user' || message.role === 'assistant') {
        anthropicMessages.push({
          role: message.role,
          content: message.content,
        });
      }
    }

    // Ensure messages alternate between user and assistant
    // and start with a user message
    const cleanedMessages = this.ensureMessageAlternation(anthropicMessages);

    return { system, anthropicMessages: cleanedMessages };
  }

  // Ensure messages alternate between user and assistant
  private ensureMessageAlternation(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    const cleaned: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const lastMessage = cleaned[cleaned.length - 1];
      
      if (!message) continue;
      
      // Ensure first message is from user
      if (cleaned.length === 0 && message.role !== 'user') {
        cleaned.push({ role: 'user', content: 'Continue.' });
      }
      
      // Merge consecutive messages from same role
      if (lastMessage && message.role && lastMessage.role === message.role) {
        lastMessage.content = `${lastMessage.content}\n\n${message.content || ''}`;
      } else if (message.role && message.content) {
        cleaned.push({ role: message.role as 'user' | 'assistant', content: message.content });
      }
    }
    
    // Ensure last message is from user if needed
    const lastCleaned = cleaned[cleaned.length - 1];
    if (cleaned.length > 0 && lastCleaned && lastCleaned.role === 'assistant') {
      cleaned.push({ role: 'user', content: 'Continue with the response.' });
    }
    
    return cleaned;
  }

  // Convert Zod schema to human-readable description
  private schemaToDescription(schema: z.ZodSchema<any>): string {
    try {
      const shape = (schema as any)._def?.shape;
      if (shape) {
        const fields = Object.entries(shape).map(([key, value]: [string, any]) => {
          const type = value._def?.typeName?.replace('Zod', '').toLowerCase() || 'unknown';
          return `"${key}": ${type}`;
        });
        return `{ ${fields.join(', ')} }`;
      }
      
      // For arrays
      if ((schema as any)._def?.typeName === 'ZodArray') {
        return 'Array of objects';
      }
      
      return 'Object';
    } catch (error) {
      return 'Object';
    }
  }
}