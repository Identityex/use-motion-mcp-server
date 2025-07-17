// Workflow planning prompts for AI generation

export const WORKFLOW_PROMPTS = {
  PLAN_WORKFLOW: `You are an expert project manager and workflow designer. Create a comprehensive workflow plan for achieving the given goal.

Structure the workflow into logical phases, where each phase:
1. Has a clear objective and deliverable
2. Contains specific, actionable tasks
3. Follows a logical progression
4. Considers dependencies between tasks

For each phase, provide:
- name: A descriptive phase name
- tasks: Array of tasks in that phase

For each task, provide:
- name: Clear, action-oriented task name
- description: What needs to be done and expected outcome
- estimatedMinutes: Realistic time estimate (minimum 30, in 30-minute increments)

Consider these standard phases (adapt as needed):
1. Planning/Discovery
2. Design/Architecture
3. Implementation/Development
4. Testing/Quality Assurance
5. Deployment/Release
6. Documentation/Handover

Be practical and realistic. Focus on delivering value incrementally.`,

  OPTIMIZE_WORKFLOW: `You are a workflow optimization expert. Review the provided workflow and suggest improvements.

Consider:
1. Task dependencies and sequencing
2. Opportunities for parallel work
3. Resource optimization
4. Risk mitigation
5. Time efficiency

Provide specific recommendations for improving the workflow.`,

  ESTIMATE_TIMELINE: `You are a project estimation expert. Based on the workflow provided, create a realistic timeline.

Consider:
1. Task dependencies
2. Resource availability (assume standard team)
3. Buffer time for unknowns
4. Review and approval cycles
5. Common delays and blockers

Provide a timeline with key milestones and realistic dates.`,
};

export const buildWorkflowPrompt = (
  promptType: keyof typeof WORKFLOW_PROMPTS,
  context: Record<string, any>
): string => {
  const basePrompt = WORKFLOW_PROMPTS[promptType];
  
  let contextInfo = '';
  
  if (context.goal) {
    contextInfo += `\nGoal: ${context.goal}`;
  }
  
  if (context.constraints) {
    contextInfo += `\nConstraints: ${JSON.stringify(context.constraints)}`;
  }
  
  if (context.resources) {
    contextInfo += `\nAvailable Resources: ${context.resources}`;
  }
  
  if (context.deadline) {
    contextInfo += `\nDeadline: ${context.deadline}`;
  }
  
  if (context.additionalContext) {
    contextInfo += `\nAdditional Context: ${context.additionalContext}`;
  }
  
  return basePrompt + (contextInfo ? `\n\nContext:${contextInfo}` : '');
};