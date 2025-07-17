// AI Service
// Integration with AI services for content enhancement and generation

import { z } from 'zod';
import { BaseAIProvider } from './providers/base-provider';
import { AIProviderFactory, AIProviderType } from './providers/provider-factory';
import { buildTaskPrompt, TASK_PROMPTS } from './prompts/task-prompts';
import { buildWorkflowPrompt, WORKFLOW_PROMPTS } from './prompts/workflow-prompts';
import { buildDocsPrompt, DOCS_PROMPTS } from './prompts/docs-prompts';

export interface AIServiceConfig {
  readonly provider?: AIProviderType;
  readonly apiKey?: string;
  readonly model?: string;
  readonly baseUrl?: string;
  readonly enableEnrichment: boolean;
}

export interface AIService {
  readonly enhanceTaskDescription: (description: string, context?: { projectName?: string; taskName?: string; context?: string }) => Promise<string>;
  readonly enhanceProjectDescription: (description: string, context?: { projectName?: string }) => Promise<string>;
  readonly generateTaskSuggestions: (projectContext: string) => Promise<string[]>;
  readonly breakdownGoal: (params: { goal: string; maxTasks?: number; context?: string }) => Promise<Array<{ name: string; description: string; priority?: string; estimatedMinutes?: number }>>;
  readonly analyzeTask: (params: { name: string; description?: string }) => Promise<{ complexity: string; estimatedMinutes: number }>;
  readonly generateWorkflowPlan: (params: { goal: string; context?: string; constraints?: Record<string, any> }) => Promise<{ phases: Array<{ name: string; tasks: Array<{ name: string; description: string; estimatedMinutes: number }> }> }>;
  readonly generateReadme: (context: any) => Promise<string>;
  readonly generateArchitectureDoc: (context: any) => Promise<string>;
  readonly generateApiDoc: (context: any) => Promise<string>;
  readonly generateUserGuide: (context: any) => Promise<string>;
}

// Zod schemas for structured outputs
const TaskBreakdownSchema = z.array(z.object({
  name: z.string(),
  description: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  estimatedMinutes: z.number().optional(),
}));

const TaskAnalysisSchema = z.object({
  complexity: z.enum(['SIMPLE', 'MEDIUM', 'COMPLEX']),
  estimatedMinutes: z.number(),
});

const WorkflowPlanSchema = z.object({
  phases: z.array(z.object({
    name: z.string(),
    tasks: z.array(z.object({
      name: z.string(),
      description: z.string(),
      estimatedMinutes: z.number(),
    })),
  })),
});

export function createAIService(deps: {
  readonly config: AIServiceConfig;
}): AIService {
  // Create AI provider based on configuration
  const provider: BaseAIProvider | null = deps.config.enableEnrichment && deps.config.provider
    ? AIProviderFactory.create({
        provider: deps.config.provider,
        apiKey: deps.config.apiKey,
        model: deps.config.model || AIProviderFactory.getDefaultConfig(deps.config.provider).model!,
        baseUrl: deps.config.baseUrl,
        ...AIProviderFactory.getDefaultConfig(deps.config.provider),
      })
    : null;

  // If no provider is configured, use mock provider
  const aiProvider = provider || AIProviderFactory.create({
    provider: 'mock',
    model: 'mock-model',
  });

  return {
    enhanceTaskDescription: async (description, context) => {
      if (!deps.config.enableEnrichment) {
        return description;
      }

      const systemPrompt = buildTaskPrompt('ENHANCE_TASK_DESCRIPTION', context || {});
      const userPrompt = `Task: ${context?.taskName || 'Task'}\nDescription: ${description}`;
      
      const messages = aiProvider['buildMessages'](systemPrompt, userPrompt);
      return await aiProvider.generateText(messages);
    },

    enhanceProjectDescription: async (description, context) => {
      if (!deps.config.enableEnrichment) {
        return description;
      }

      const systemPrompt = `You are a project management expert. Enhance this project description to be more comprehensive and actionable.
Include: objectives, scope, success criteria, and key deliverables.`;
      const userPrompt = `Project: ${context?.projectName || 'Project'}\nDescription: ${description}`;
      
      const messages = aiProvider['buildMessages'](systemPrompt, userPrompt);
      return await aiProvider.generateText(messages);
    },

    generateTaskSuggestions: async (projectContext) => {
      if (!deps.config.enableEnrichment) {
        return [];
      }

      const systemPrompt = buildTaskPrompt('TASK_SUGGESTIONS', { additionalContext: projectContext });
      const userPrompt = `Based on the project context, suggest relevant tasks that should be included.`;
      
      const messages = aiProvider['buildMessages'](systemPrompt, userPrompt);
      const response = await aiProvider.generateText(messages);
      
      // Parse response into array of task names
      return response.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^[-*]\s*/, '').trim())
        .slice(0, 10);
    },

    breakdownGoal: async (params) => {
      if (!deps.config.enableEnrichment) {
        return [{
          name: params.goal,
          description: 'Complete this task',
          priority: 'MEDIUM',
          estimatedMinutes: 60,
        }];
      }

      const systemPrompt = buildTaskPrompt('BREAKDOWN_GOAL', {
        additionalContext: params.context,
      });
      const userPrompt = `Break down this goal into specific tasks: "${params.goal}"
Maximum tasks: ${params.maxTasks || 5}`;
      
      const messages = aiProvider['buildMessages'](systemPrompt, userPrompt);
      return await aiProvider.generateStructured(messages, TaskBreakdownSchema);
    },

    analyzeTask: async (params) => {
      if (!deps.config.enableEnrichment) {
        // Simple fallback analysis
        const textLength = (params.name + (params.description || '')).length;
        return {
          complexity: textLength < 50 ? 'SIMPLE' : textLength < 150 ? 'MEDIUM' : 'COMPLEX',
          estimatedMinutes: textLength < 50 ? 30 : textLength < 150 ? 90 : 180,
        };
      }

      const systemPrompt = buildTaskPrompt('ANALYZE_TASK', {});
      const userPrompt = `Analyze this task:
Name: ${params.name}
Description: ${params.description || 'No description provided'}`;
      
      const messages = aiProvider['buildMessages'](systemPrompt, userPrompt);
      return await aiProvider.generateStructured(messages, TaskAnalysisSchema);
    },

    generateWorkflowPlan: async (params) => {
      if (!deps.config.enableEnrichment) {
        // Return simple default workflow
        return {
          phases: [
            {
              name: 'Planning',
              tasks: [
                { name: 'Define requirements', description: 'Define project requirements', estimatedMinutes: 120 },
                { name: 'Create design', description: 'Create system design', estimatedMinutes: 180 },
              ],
            },
            {
              name: 'Implementation',
              tasks: [
                { name: 'Build features', description: 'Implement core features', estimatedMinutes: 960 },
                { name: 'Write tests', description: 'Create test suite', estimatedMinutes: 480 },
              ],
            },
          ],
        };
      }

      const systemPrompt = buildWorkflowPrompt('PLAN_WORKFLOW', {
        goal: params.goal,
        constraints: params.constraints,
        additionalContext: params.context,
      });
      const userPrompt = `Create a workflow plan for: "${params.goal}"`;
      
      const messages = aiProvider['buildMessages'](systemPrompt, userPrompt);
      return await aiProvider.generateStructured(messages, WorkflowPlanSchema);
    },

    generateReadme: async (context) => {
      if (!deps.config.enableEnrichment) {
        return `# ${context.projectName || 'Project'}\n\n${context.projectDescription || 'Project description'}\n\n## Tasks\n\n${context.tasks?.map((t: any) => `- ${t.name}`).join('\n') || 'No tasks defined.'}`;
      }

      const systemPrompt = buildDocsPrompt('GENERATE_README', context);
      const userPrompt = 'Generate a comprehensive README.md file for this project.';
      
      const messages = aiProvider['buildMessages'](systemPrompt, userPrompt);
      return await aiProvider.generateText(messages);
    },

    generateArchitectureDoc: async (context) => {
      if (!deps.config.enableEnrichment) {
        return `# Architecture Documentation\n\n## ${context.projectName || 'Project'}\n\n${context.projectDescription || 'Architecture overview'}`;
      }

      const systemPrompt = buildDocsPrompt('GENERATE_ARCHITECTURE', context);
      const userPrompt = 'Generate architecture documentation for this project.';
      
      const messages = aiProvider['buildMessages'](systemPrompt, userPrompt);
      return await aiProvider.generateText(messages);
    },

    generateApiDoc: async (context) => {
      if (!deps.config.enableEnrichment) {
        return `# API Documentation\n\n## ${context.projectName || 'API'}\n\nAPI endpoints based on project tasks.`;
      }

      const systemPrompt = buildDocsPrompt('GENERATE_API_DOC', context);
      const userPrompt = 'Generate API documentation for this project.';
      
      const messages = aiProvider['buildMessages'](systemPrompt, userPrompt);
      return await aiProvider.generateText(messages);
    },

    generateUserGuide: async (context) => {
      if (!deps.config.enableEnrichment) {
        return `# User Guide\n\n## ${context.projectName || 'Application'}\n\nUser guide for the application.`;
      }

      const systemPrompt = buildDocsPrompt('GENERATE_USER_GUIDE', context);
      const userPrompt = 'Generate a user guide for this project.';
      
      const messages = aiProvider['buildMessages'](systemPrompt, userPrompt);
      return await aiProvider.generateText(messages);
    },
  };
}