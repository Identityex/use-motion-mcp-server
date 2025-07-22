// Type Mappers
// Utilities for mapping between Motion API types and MCP types

import { MotionStatus, MotionTask } from '../../api/mcp/v1-routes/models/index.js';

// Map simple string status to Motion status object
export function stringToMotionStatus(status: string): MotionStatus {
  switch (status) {
    case 'TODO':
    case 'PLANNED':
      return {
        name: 'Planned',
        isDefaultStatus: true,
        isResolvedStatus: false,
      };
    case 'IN_PROGRESS':
      return {
        name: 'In Progress',
        isDefaultStatus: false,
        isResolvedStatus: false,
      };
    case 'COMPLETED':
      return {
        name: 'Completed',
        isDefaultStatus: false,
        isResolvedStatus: true,
      };
    case 'CANCELLED':
    case 'CANCELED':
      return {
        name: 'Canceled',
        isDefaultStatus: false,
        isResolvedStatus: true,
      };
    default:
      return {
        name: status,
        isDefaultStatus: false,
        isResolvedStatus: false,
      };
  }
}

// Map Motion status object to simple string
export function motionStatusToString(status: MotionStatus): string {
  switch (status.name.toLowerCase()) {
    case 'planned':
      return 'TODO';
    case 'in progress':
      return 'IN_PROGRESS';
    case 'completed':
      return 'COMPLETED';
    case 'canceled':
    case 'cancelled':
      return 'CANCELLED';
    default:
      return status.isResolvedStatus ? 'COMPLETED' : 'TODO';
  }
}

// Map task with proper status conversion
export function mapTaskForMCP(task: MotionTask): MotionTask & { status: string } {
  return {
    ...task,
    status: motionStatusToString(task.status) as any,
  };
}

// Map task with proper status conversion for Motion API
export function mapTaskForMotion(task: any): MotionTask {
  if (typeof task.status === 'string') {
    return {
      ...task,
      status: stringToMotionStatus(task.status),
    };
  }
  return task;
}