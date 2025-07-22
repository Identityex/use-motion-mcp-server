// AI Provider Factory
// Creates the appropriate AI provider based on configuration

import { BaseAIProvider, AIProviderConfig } from './base-provider.js';
import { MockAIProvider } from './mock-provider.js';
import { OpenAIProvider } from './openai-provider.js';
import { AnthropicProvider } from './anthropic-provider.js';

export type AIProviderType = 'openai' | 'anthropic' | 'mock' | 'custom';

export interface AIProviderFactoryConfig extends AIProviderConfig {
  readonly provider: AIProviderType;
}

export class AIProviderFactory {
  static create(config: AIProviderFactoryConfig): BaseAIProvider {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config);
      
      case 'anthropic':
        return new AnthropicProvider(config);
      
      case 'mock':
        return new MockAIProvider(config);
      
      case 'custom':
        // For custom providers, use OpenAI provider with custom base URL
        if (!config.baseUrl) {
          throw new Error('Custom provider requires a base URL');
        }
        return new OpenAIProvider(config);
      
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  static getDefaultConfig(provider: AIProviderType): Partial<AIProviderConfig> {
    switch (provider) {
      case 'openai':
        return {
          model: 'gpt-4o-mini',
          maxTokens: 2000,
          temperature: 0.7,
        };
      
      case 'anthropic':
        return {
          model: 'claude-3-haiku-20240307',
          maxTokens: 2000,
          temperature: 0.7,
        };
      
      case 'mock':
        return {
          model: 'mock-model',
          maxTokens: 2000,
          temperature: 0.7,
        };
      
      default:
        return {
          maxTokens: 2000,
          temperature: 0.7,
        };
    }
  }
}