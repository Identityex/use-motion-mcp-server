// Docs Commands
// Operations for documentation generation and management

import { AIService } from '../../services/ai/ai-service';
import { StorageService } from '../../services/storage/storage-service';
import { MotionService } from '../../services/motion-service';
import {
  CreateDocsRequest,
  UpdateDocsRequest,
  StatusReportRequest
} from '../../api/mcp/v1-routes/models';
import { motionStatusToString } from '../../services/utils/type-mappers';

export interface DocsCommands {
  readonly createDocs: (req: CreateDocsRequest) => Promise<{
    projectId: string;
    docId: string;
    created: boolean;
  }>;
  readonly updateDocs: (req: UpdateDocsRequest) => Promise<{
    projectId: string;
    docId: string;
    updated: boolean;
  }>;
  readonly generateStatusReport: (req: StatusReportRequest) => Promise<{
    projectId: string;
    report: string;
  }>;
}

export function createDocsCommands(deps: {
  readonly services: {
    readonly aiService: AIService;
    readonly storageService: StorageService;
    readonly motionService: MotionService;
  };
}): DocsCommands {
  return {
    createDocs: async (req) => {
      // Get project info
      const projects = await deps.services.motionService.listProjects({
        limit: 1,
      });
      const project = projects.find(p => p.id === req.projectId);
      
      if (!project) {
        throw new Error(`Project ${req.projectId} not found`);
      }
      
      // Get tasks for the project
      const tasks = await deps.services.motionService.listTasks({
        projectId: req.projectId,
      });
      
      // Generate documentation based on type
      let content = '';
      const context = {
        projectName: project.name,
        projectDescription: project.description,
        taskCount: tasks.length,
        tasks: tasks.map(t => ({ name: t.name, description: t.description })),
      };
      
      switch (req.type) {
        case 'readme':
          content = await deps.services.aiService.generateReadme(context);
          break;
        case 'architecture':
          content = await deps.services.aiService.generateArchitectureDoc(context);
          break;
        case 'api':
          content = await deps.services.aiService.generateApiDoc(context);
          break;
        case 'user-guide':
          content = await deps.services.aiService.generateUserGuide(context);
          break;
      }
      
      // Save to storage
      const docId = `${req.type}-${Date.now()}`;
      await deps.services.storageService.saveDocument(
        req.projectId,
        docId,
        content
      );
      
      return {
        projectId: req.projectId,
        docId,
        created: true,
      };
    },

    updateDocs: async (req) => {
      // Update existing document
      await deps.services.storageService.saveDocument(
        req.projectId,
        req.docId,
        req.content
      );
      
      return {
        projectId: req.projectId,
        docId: req.docId,
        updated: true,
      };
    },

    generateStatusReport: async (req) => {
      // Get project info
      const projects = await deps.services.motionService.listProjects({
        limit: 100,
      });
      const project = projects.find(p => p.id === req.projectId);
      
      if (!project) {
        throw new Error(`Project ${req.projectId} not found`);
      }
      
      // Get tasks
      const tasks = await deps.services.motionService.listTasks({
        projectId: req.projectId,
      });
      
      // Calculate metrics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => motionStatusToString(t.status) === 'COMPLETED').length;
      const inProgressTasks = tasks.filter(t => motionStatusToString(t.status) === 'IN_PROGRESS').length;
      const todoTasks = tasks.filter(t => motionStatusToString(t.status) === 'TODO').length;
      
      // Generate report based on format
      let report = '';
      if (req.format === 'json') {
        report = JSON.stringify({
          project: {
            id: project.id,
            name: project.name,
            description: project.description,
          },
          metrics: {
            total: totalTasks,
            completed: completedTasks,
            inProgress: inProgressTasks,
            todo: todoTasks,
            completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0,
          },
          tasks: req.includeMetrics ? tasks : undefined,
        }, null, 2);
      } else {
        // Markdown format
        report = `# Status Report: ${project.name}\n\n`;
        report += `${project.description || 'No description provided'}\n\n`;
        report += `## Summary\n\n`;
        report += `- Total Tasks: ${totalTasks}\n`;
        report += `- Completed: ${completedTasks} (${totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0}%)\n`;
        report += `- In Progress: ${inProgressTasks}\n`;
        report += `- To Do: ${todoTasks}\n\n`;
        
        if (req.includeMetrics && tasks.length > 0) {
          report += `## Task Details\n\n`;
          
          const tasksByStatus = {
            'IN_PROGRESS': tasks.filter(t => motionStatusToString(t.status) === 'IN_PROGRESS'),
            'TODO': tasks.filter(t => motionStatusToString(t.status) === 'TODO'),
            'COMPLETED': tasks.filter(t => motionStatusToString(t.status) === 'COMPLETED'),
          };
          
          for (const [status, statusTasks] of Object.entries(tasksByStatus)) {
            if (statusTasks.length > 0) {
              report += `### ${status.replace('_', ' ')}\n\n`;
              for (const task of statusTasks) {
                report += `- **${task.name}**\n`;
                if (task.description) {
                  report += `  ${task.description}\n`;
                }
              }
              report += '\n';
            }
          }
        }
      }
      
      return {
        projectId: req.projectId,
        report,
      };
    },
  };
}