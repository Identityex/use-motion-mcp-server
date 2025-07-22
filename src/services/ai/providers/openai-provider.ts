// OpenAI Provider
// Implements AI functionality using OpenAI's GPT models

import OpenAI from 'openai';
import { z } from 'zod';
import { encoding_for_model, TiktokenModel } from 'tiktoken';
import { BaseAIProvider, ChatMessage, GenerationOptions, AIProviderConfig } from './base-provider.js';

export class OpenAIProvider extends BaseAIProvider {
  private client: OpenAI | null = null;
  private encoder: any = null;

  constructor(config: AIProviderConfig) {
    super(config);
    
    if (config.apiKey) {
      this.client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl,
      });

      // Initialize tokenizer for the model
      try {
        const modelName = this.getModelForTokenizer(config.model);
        this.encoder = encoding_for_model(modelName);
      } catch (error) {
        console.warn('Failed to initialize tokenizer:', error);
      }
    }
  }

  async generateText(
    messages: ChatMessage[],
    options?: GenerationOptions
  ): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Please provide an API key.');
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages as any,
        max_tokens: options?.maxTokens || this.config.maxTokens || 2000,
        temperature: options?.temperature || this.config.temperature || 0.7,
        top_p: options?.topP || 1,
        frequency_penalty: options?.frequencyPenalty || 0,
        presence_penalty: options?.presencePenalty || 0,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return content;
    } catch (error: any) {
      throw new Error(`OpenAI generation failed: ${error.message}`);
    }
  }

  async generateStructured<T>(
    messages: ChatMessage[],
    schema: z.ZodSchema<T>,
    options?: GenerationOptions
  ): Promise<T> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Please provide an API key.');
    }

    // Add instruction to return JSON
    const structuredMessages = [...messages];
    const lastMessage = structuredMessages[structuredMessages.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
      structuredMessages[structuredMessages.length - 1] = {
        role: lastMessage.role,
        content: `${lastMessage.content}\n\nReturn your response as valid JSON that matches this schema:\n${this.schemaToDescription(schema)}`,
      };
    }

    try {
      // Use JSON mode if available for the model
      const supportsJsonMode = this.supportsJsonMode();
      
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: structuredMessages as any,
        max_tokens: options?.maxTokens || this.config.maxTokens || 2000,
        temperature: options?.temperature || this.config.temperature || 0.7,
        top_p: options?.topP || 1,
        frequency_penalty: options?.frequencyPenalty || 0,
        presence_penalty: options?.presencePenalty || 0,
        ...(supportsJsonMode && { response_format: { type: 'json_object' } }),
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return await this.validateResponse(content, schema);
    } catch (error: any) {
      throw new Error(`OpenAI structured generation failed: ${error.message}`);
    }
  }

  async countTokens(text: string): Promise<number> {
    if (this.encoder) {
      try {
        const tokens = this.encoder.encode(text);
        return tokens.length;
      } catch (error) {
        // Fallback to approximation
        return Math.ceil(text.length / 4);
      }
    }
    
    // Approximation if encoder not available
    return Math.ceil(text.length / 4);
  }

  async isAvailable(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      // Try a simple API call to check availability
      await this.client.models.list();
      return true;
    } catch (error) {
      return false;
    }
  }

  getProviderName(): string {
    return `OpenAI (${this.config.model})`;
  }

  // Helper to determine if model supports JSON mode
  private supportsJsonMode(): boolean {
    const jsonModeModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4-turbo-preview'];
    return jsonModeModels.some(model => this.config.model.includes(model));
  }

  // Get tiktoken model name
  private getModelForTokenizer(model: string): TiktokenModel {
    // Map model names to tiktoken model names
    if (model.includes('gpt-4o')) return 'gpt-4o';
    if (model.includes('gpt-4')) return 'gpt-4';
    if (model.includes('gpt-3.5')) return 'gpt-3.5-turbo';
    
    // Default to gpt-4 tokenizer
    return 'gpt-4';
  }

  // Convert Zod schema to human-readable description
  private schemaToDescription(schema: z.ZodSchema<any>): string {
    // This is a simplified version. In production, you might want to use
    // a more sophisticated schema description generator
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