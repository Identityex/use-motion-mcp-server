// Mock AI Provider
// Provides mock implementations for testing and when AI is disabled

import { z } from 'zod';
import { BaseAIProvider, ChatMessage, GenerationOptions, AIProviderConfig } from './base-provider';

export class MockAIProvider extends BaseAIProvider {
  constructor(config: AIProviderConfig) {
    super(config);
  }

  async generateText(
    messages: ChatMessage[],
    options?: GenerationOptions
  ): Promise<string> {
    // Return simple mock responses based on the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return 'Mock response';
    }

    const content = lastMessage.content.toLowerCase();

    // Simple pattern matching for different types of requests
    if (content.includes('enhance') && content.includes('task')) {
      return this.mockEnhanceTask(content);
    } else if (content.includes('enhance') && content.includes('project')) {
      return this.mockEnhanceProject(content);
    } else if (content.includes('breakdown') || content.includes('tasks')) {
      return this.mockBreakdownGoal(content);
    } else if (content.includes('workflow') || content.includes('plan')) {
      return this.mockWorkflowPlan(content);
    } else if (content.includes('readme')) {
      return this.mockReadme(content);
    } else if (content.includes('architecture')) {
      return this.mockArchitecture(content);
    } else if (content.includes('api')) {
      return this.mockApiDoc(content);
    } else if (content.includes('guide')) {
      return this.mockUserGuide(content);
    }

    return 'Mock AI response for: ' + content;
  }

  async generateStructured<T>(
    messages: ChatMessage[],
    schema: z.ZodSchema<T>,
    options?: GenerationOptions
  ): Promise<T> {
    // Generate mock structured data based on schema
    const schemaDescription = schema._def;
    
    // For task breakdown
    if (this.isTaskBreakdownSchema(schemaDescription)) {
      const mockTasks = [
        {
          name: 'Define requirements',
          description: 'Gather and document all project requirements',
          priority: 'HIGH',
          estimatedMinutes: 60,
        },
        {
          name: 'Design architecture',
          description: 'Create high-level system design',
          priority: 'HIGH',
          estimatedMinutes: 120,
        },
        {
          name: 'Implement core features',
          description: 'Build the main functionality',
          priority: 'MEDIUM',
          estimatedMinutes: 480,
        },
        {
          name: 'Write tests',
          description: 'Create unit and integration tests',
          priority: 'MEDIUM',
          estimatedMinutes: 240,
        },
        {
          name: 'Deploy and verify',
          description: 'Deploy to production and verify functionality',
          priority: 'LOW',
          estimatedMinutes: 60,
        },
      ];
      return mockTasks as any;
    }

    // For workflow planning
    if (this.isWorkflowPlanSchema(schemaDescription)) {
      const mockPlan = {
        phases: [
          {
            name: 'Planning Phase',
            tasks: [
              {
                name: 'Requirements gathering',
                description: 'Collect and document all requirements',
                estimatedMinutes: 120,
              },
              {
                name: 'Technical design',
                description: 'Create technical architecture and design docs',
                estimatedMinutes: 180,
              },
            ],
          },
          {
            name: 'Implementation Phase',
            tasks: [
              {
                name: 'Core development',
                description: 'Implement main features',
                estimatedMinutes: 960,
              },
              {
                name: 'Testing',
                description: 'Write and run tests',
                estimatedMinutes: 480,
              },
            ],
          },
          {
            name: 'Deployment Phase',
            tasks: [
              {
                name: 'Deployment setup',
                description: 'Configure deployment pipeline',
                estimatedMinutes: 120,
              },
              {
                name: 'Production release',
                description: 'Deploy and monitor',
                estimatedMinutes: 60,
              },
            ],
          },
        ],
      };
      return mockPlan as any;
    }

    // For task analysis
    if (this.isTaskAnalysisSchema(schemaDescription)) {
      return {
        complexity: 'MEDIUM',
        estimatedMinutes: 120,
      } as any;
    }

    // Default mock object
    return {} as T;
  }

  async countTokens(text: string): Promise<number> {
    // Simple approximation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  async isAvailable(): Promise<boolean> {
    return true; // Mock provider is always available
  }

  getProviderName(): string {
    return 'Mock AI Provider';
  }

  // Helper methods for generating mock content
  private mockEnhanceTask(content: string): string {
    return `Enhanced Task Description:

This task involves completing the specified work with attention to quality and timeliness.

## Acceptance Criteria:
- Task requirements are fully met
- Code follows project standards
- All tests pass successfully
- Documentation is updated
- Changes are reviewed and approved

## Technical Considerations:
- Consider performance implications
- Ensure backward compatibility
- Follow security best practices
- Update relevant documentation

## Definition of Done:
- Feature is implemented and tested
- Code is reviewed and merged
- Documentation is updated
- Deployed to staging environment`;
  }

  private mockEnhanceProject(content: string): string {
    return `Enhanced Project Description:

This project aims to deliver high-quality solutions that meet business objectives and user needs.

## Project Goals:
- Deliver value to end users
- Maintain high code quality
- Meet project timelines
- Stay within budget constraints

## Key Deliverables:
- Fully functional application
- Comprehensive documentation
- Test coverage > 80%
- Performance benchmarks met

## Success Metrics:
- User satisfaction score > 4.5/5
- Zero critical bugs in production
- On-time delivery
- Budget adherence`;
  }

  private mockBreakdownGoal(content: string): string {
    return JSON.stringify([
      {
        name: 'Research and Planning',
        description: 'Conduct initial research and create project plan',
        priority: 'HIGH',
        estimatedMinutes: 120,
      },
      {
        name: 'Design Phase',
        description: 'Create designs and architecture',
        priority: 'HIGH',
        estimatedMinutes: 240,
      },
      {
        name: 'Implementation',
        description: 'Build core functionality',
        priority: 'MEDIUM',
        estimatedMinutes: 480,
      },
      {
        name: 'Testing and QA',
        description: 'Comprehensive testing and quality assurance',
        priority: 'MEDIUM',
        estimatedMinutes: 180,
      },
      {
        name: 'Deployment',
        description: 'Deploy to production',
        priority: 'LOW',
        estimatedMinutes: 60,
      },
    ]);
  }

  private mockWorkflowPlan(content: string): string {
    return JSON.stringify({
      phases: [
        {
          name: 'Discovery',
          tasks: [
            { name: 'Stakeholder interviews', description: 'Interview key stakeholders', estimatedMinutes: 180 },
            { name: 'Requirements documentation', description: 'Document all requirements', estimatedMinutes: 120 },
          ],
        },
        {
          name: 'Development',
          tasks: [
            { name: 'Backend development', description: 'Build API and services', estimatedMinutes: 960 },
            { name: 'Frontend development', description: 'Build user interface', estimatedMinutes: 720 },
          ],
        },
        {
          name: 'Launch',
          tasks: [
            { name: 'Beta testing', description: 'Run beta test program', estimatedMinutes: 480 },
            { name: 'Production launch', description: 'Launch to all users', estimatedMinutes: 120 },
          ],
        },
      ],
    });
  }

  private mockReadme(content: string): string {
    return `# Project Name

## Overview
This project provides a comprehensive solution for task management and workflow automation.

## Features
- Task creation and management
- Project organization
- Workflow automation
- AI-powered enhancements
- Real-time synchronization

## Getting Started
1. Clone the repository
2. Install dependencies: \`npm install\`
3. Configure environment variables
4. Run the application: \`npm start\`

## Documentation
See the \`docs\` directory for detailed documentation.

## Contributing
Please read CONTRIBUTING.md for contribution guidelines.

## License
This project is licensed under the MIT License.`;
  }

  private mockArchitecture(content: string): string {
    return `# Architecture Documentation

## System Overview
The system follows a clean architecture pattern with clear separation of concerns.

## Core Components
- **API Layer**: RESTful API endpoints
- **Business Logic**: Core domain logic
- **Data Layer**: Database and storage
- **Integration Layer**: External service integrations

## Technology Stack
- Backend: Node.js with TypeScript
- Database: PostgreSQL
- Cache: Redis
- Queue: RabbitMQ

## Deployment Architecture
The application is deployed using containerized microservices on Kubernetes.`;
  }

  private mockApiDoc(content: string): string {
    return `# API Documentation

## Base URL
\`https://api.example.com/v1\`

## Authentication
All requests require an API key in the Authorization header:
\`Authorization: Bearer YOUR_API_KEY\`

## Endpoints

### GET /projects
List all projects

### POST /projects
Create a new project

### GET /tasks
List all tasks

### POST /tasks
Create a new task

## Error Handling
Errors are returned in a standard format with appropriate HTTP status codes.`;
  }

  private mockUserGuide(content: string): string {
    return `# User Guide

## Getting Started
Welcome to the application! This guide will help you get up and running quickly.

## Creating Your First Project
1. Click "New Project"
2. Enter project details
3. Click "Create"

## Managing Tasks
- To create a task, click the "+" button
- To edit a task, click on it
- To complete a task, check the checkbox

## Tips and Tricks
- Use keyboard shortcuts for faster navigation
- Set up notifications for important updates
- Use tags to organize your work

## Support
If you need help, contact support@example.com`;
  }

  // Helper methods to identify schema types
  private isTaskBreakdownSchema(schemaDef: any): boolean {
    // Check if it's an array schema with task-like properties
    return schemaDef?.typeName === 'ZodArray';
  }

  private isWorkflowPlanSchema(schemaDef: any): boolean {
    // Check if it has phases property
    return schemaDef?.shape?.phases !== undefined;
  }

  private isTaskAnalysisSchema(schemaDef: any): boolean {
    // Check if it has complexity and estimatedMinutes
    return schemaDef?.shape?.complexity !== undefined;
  }
}