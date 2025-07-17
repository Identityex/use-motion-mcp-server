// Documentation generation prompts for AI

export const DOCS_PROMPTS = {
  GENERATE_README: `You are a technical documentation expert. Create a comprehensive README.md file for the project.

Include these sections:
1. Project Title and Description
2. Features/Capabilities
3. Getting Started
   - Prerequisites
   - Installation
   - Configuration
4. Usage Examples
5. Project Structure (if applicable)
6. Contributing Guidelines
7. License Information
8. Contact/Support

Use the project information and tasks provided to create accurate, helpful documentation.
Format using Markdown. Keep it concise but comprehensive.`,

  GENERATE_ARCHITECTURE: `You are a software architect and technical writer. Create an architecture documentation file.

Include these sections:
1. System Overview
2. Architecture Principles
3. Core Components/Modules
4. Data Flow
5. Technology Stack
6. Integration Points
7. Security Considerations
8. Scalability Approach
9. Deployment Architecture
10. Future Considerations

Base the architecture on the project tasks and description provided.
Use diagrams (in Markdown/ASCII) where helpful.`,

  GENERATE_API_DOC: `You are an API documentation specialist. Create comprehensive API documentation.

Include these sections:
1. API Overview
2. Authentication
3. Base URL and Versioning
4. Common Headers
5. Endpoints (grouped by resource)
   - Method and Path
   - Description
   - Parameters
   - Request Body (with examples)
   - Response Format (with examples)
   - Error Codes
6. Rate Limiting
7. Webhooks (if applicable)
8. SDKs and Tools

Infer API structure from the project tasks. Use OpenAPI/REST conventions.
Provide clear examples for each endpoint.`,

  GENERATE_USER_GUIDE: `You are a user experience writer. Create a user-friendly guide for end users.

Include these sections:
1. Welcome/Introduction
2. Getting Started
   - First-time setup
   - Key concepts
3. Core Features (based on tasks)
   - Step-by-step instructions
   - Screenshots placeholders
   - Tips and best practices
4. Common Tasks/Workflows
5. Troubleshooting
6. FAQ
7. Glossary
8. Getting Help

Write in a friendly, accessible tone. Avoid technical jargon.
Focus on what users can accomplish, not how the system works.`,

  ENHANCE_DOCUMENTATION: `You are a technical editor. Review and enhance the provided documentation.

Improve:
1. Clarity and readability
2. Completeness
3. Accuracy
4. Consistency in tone and style
5. Organization and flow
6. Examples and use cases
7. Visual elements (diagrams, screenshots)
8. SEO and discoverability

Maintain the original structure while enhancing content quality.`,
};

export const buildDocsPrompt = (
  promptType: keyof typeof DOCS_PROMPTS,
  context: Record<string, any>
): string => {
  const basePrompt = DOCS_PROMPTS[promptType];
  
  let contextInfo = '';
  
  if (context.projectName) {
    contextInfo += `\nProject Name: ${context.projectName}`;
  }
  
  if (context.projectDescription) {
    contextInfo += `\nProject Description: ${context.projectDescription}`;
  }
  
  if (context.tasks && context.tasks.length > 0) {
    contextInfo += `\nProject Tasks:`;
    context.tasks.forEach((task: any) => {
      contextInfo += `\n- ${task.name}: ${task.description || 'No description'}`;
    });
  }
  
  if (context.taskCount) {
    contextInfo += `\nTotal Tasks: ${context.taskCount}`;
  }
  
  if (context.techStack) {
    contextInfo += `\nTechnology Stack: ${context.techStack}`;
  }
  
  if (context.targetAudience) {
    contextInfo += `\nTarget Audience: ${context.targetAudience}`;
  }
  
  if (context.template) {
    contextInfo += `\nCustom Template:\n${context.template}`;
  }
  
  return basePrompt + (contextInfo ? `\n\nProject Information:${contextInfo}` : '');
};