// Workflow Commands
// Operations for workflow planning and generation

import { AIService } from '../../services/ai/ai-service';
import { MotionService } from '../../services/motion-service';
import { CreateTaskRequest } from '../../api/mcp/v1-routes/models';

export interface PlanWorkflowRequest {
  readonly goal: string;
  readonly projectId: string;
  readonly context?: string;
  readonly constraints?: Record<string, any>;
}

export interface WorkflowCommands {
  readonly planWorkflow: (req: PlanWorkflowRequest) => Promise<{
    plan: {
      phases: Array<{
        name: string;
        tasks: Array<{
          name: string;
          description: string;
          estimatedMinutes: number;
        }>;
      }>;
    };
    created: boolean;
  }>;
}

export function createWorkflowCommands(deps: {
  readonly services: {
    readonly aiService: AIService;
    readonly motionService: MotionService;
  };
}): WorkflowCommands {
  return {
    planWorkflow: async (req) => {
      // Generate workflow plan with AI
      const plan = await deps.services.aiService.generateWorkflowPlan({
        goal: req.goal,
        context: req.context,
        constraints: req.constraints,
      });
      
      // Optionally create tasks in Motion
      let created = false;
      if (req.projectId) {
        for (const phase of plan.phases) {
          for (const task of phase.tasks) {
            await deps.services.motionService.createTask({
              name: `[${phase.name}] ${task.name}`,
              description: task.description,
              projectId: req.projectId,
              duration: task.estimatedMinutes,
              priority: 'MEDIUM',
            });
          }
        }
        created = true;
      }
      
      return {
        plan,
        created,
      };
    },
  };
}