// Task-related prompts for AI generation

export const TASK_PROMPTS = {
  ENHANCE_TASK_DESCRIPTION: `You are an expert project manager and technical writer. Your task is to enhance a task description to make it clear, actionable, and comprehensive.

Given a task name and basic description, provide an enhanced version that includes:
1. A clear, detailed description of what needs to be done
2. Acceptance criteria (what defines this task as complete)
3. Technical considerations (if applicable)
4. Dependencies or prerequisites
5. Definition of done

Keep the tone professional but friendly. Be specific and actionable.`,

  BREAKDOWN_GOAL: `You are an expert project manager specializing in task decomposition. Your task is to break down a high-level goal into specific, actionable tasks.

Given a goal, create a list of tasks that:
1. Are specific and measurable
2. Can be completed independently when possible
3. Have clear deliverables
4. Are ordered logically (dependencies considered)
5. Include time estimates based on complexity

For each task, provide:
- name: A clear, action-oriented title (start with a verb)
- description: What needs to be done and why
- priority: HIGH, MEDIUM, or LOW based on importance and dependencies
- estimatedMinutes: Realistic time estimate in minutes (minimum 30, in 30-minute increments)

Focus on practical, implementable tasks. Avoid vague or overly broad tasks.`,

  ANALYZE_TASK: `You are an expert at estimating software development tasks. Analyze the given task and provide:

1. Complexity assessment:
   - SIMPLE: Straightforward, well-understood, minimal dependencies
   - MEDIUM: Moderate complexity, some unknowns, several components
   - COMPLEX: High complexity, many unknowns, significant dependencies

2. Time estimate in minutes (minimum 30, in 30-minute increments):
   - Consider implementation, testing, and review time
   - Account for typical interruptions and context switching
   - Be realistic rather than optimistic

Base your analysis on the task name and description provided.`,

  TASK_SUGGESTIONS: `You are a project planning assistant. Based on the project context provided, suggest relevant tasks that might be needed.

Generate task suggestions that:
1. Fill gaps in the current project plan
2. Address common requirements often overlooked
3. Include both functional and non-functional tasks
4. Consider documentation, testing, and deployment needs

Provide 5-10 relevant task suggestions as a simple list of task names.`,
};

export const buildTaskPrompt = (
  promptType: keyof typeof TASK_PROMPTS,
  context: Record<string, any>
): string => {
  const basePrompt = TASK_PROMPTS[promptType];
  
  // Add context-specific information
  let contextInfo = '';
  
  if (context.projectName) {
    contextInfo += `\nProject: ${context.projectName}`;
  }
  
  if (context.projectDescription) {
    contextInfo += `\nProject Description: ${context.projectDescription}`;
  }
  
  if (context.existingTasks) {
    contextInfo += `\nExisting Tasks: ${context.existingTasks.join(', ')}`;
  }
  
  if (context.additionalContext) {
    contextInfo += `\nAdditional Context: ${context.additionalContext}`;
  }
  
  return basePrompt + (contextInfo ? `\n\nContext:${contextInfo}` : '');
};