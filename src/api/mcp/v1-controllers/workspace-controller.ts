import { WorkspaceController } from '../v1-routes/routes/WorkspaceControllerRoutes.js';
import { MCPToolResponse } from '../v1-routes/models/index.js';

// App layer imports
type ListWorkspacesCommand = (params: {
  limit?: number;
  cursor?: string;
}) => Promise<any>;

type SetDefaultWorkspaceCommand = (params: {
  workspaceId: string;
}) => Promise<void>;

type GetWorkspaceSettingsQuery = (params: {
  workspaceId?: string;
}) => Promise<any>;

type UpdateWorkspaceSettingsCommand = (params: {
  workspaceId: string;
  settings?: Record<string, any>;
}) => Promise<void>;

interface WorkspaceControllerDependencies {
  listWorkspacesCommand: ListWorkspacesCommand;
  setDefaultWorkspaceCommand: SetDefaultWorkspaceCommand;
  getWorkspaceSettingsQuery: GetWorkspaceSettingsQuery;
  updateWorkspaceSettingsCommand: UpdateWorkspaceSettingsCommand;
}

export function createWorkspaceController(
  deps: WorkspaceControllerDependencies
): WorkspaceController {
  const {
    listWorkspacesCommand,
    setDefaultWorkspaceCommand,
    getWorkspaceSettingsQuery,
    updateWorkspaceSettingsCommand,
  } = deps;

  return {
    async listWorkspaces(req) {
      try {
        const workspaces = await listWorkspacesCommand({
          limit: req.limit,
          cursor: req.cursor,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(workspaces, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text', text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    },

    async setDefaultWorkspace(req) {
      try {
        await setDefaultWorkspaceCommand({
          workspaceId: req.workspaceId,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Default workspace set to: ${req.workspaceId}`,
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text', text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    },

    async getWorkspaceSettings(req) {
      try {
        const settings = await getWorkspaceSettingsQuery({
          workspaceId: req.workspaceId,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(settings, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text', text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    },

    async updateWorkspaceSettings(req) {
      try {
        await updateWorkspaceSettingsCommand({
          workspaceId: req.workspaceId,
          settings: req.settings,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Workspace settings updated for: ${req.workspaceId}`,
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text', text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    },
  };
}