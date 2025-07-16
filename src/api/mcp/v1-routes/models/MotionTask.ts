// Generated model: MotionTask
// This file is auto-generated. Do not edit manually.

import { MotionStatus, AutoScheduledConfig, TimeChunk } from './';




export interface MotionTask {
  id: string;
  name: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: MotionStatus;
  assigneeId?: string;
  projectId?: string;
  workspaceId: string;
  parentRecurringTaskId?: string;
  createdTime: string;
  updatedTime: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  deadline?: string;
  deadlineType?: 'SOFT' | 'HARD';
  duration?: number;
  autoScheduled?: AutoScheduledConfig;
  completed: boolean;
  labels?: Array<string>;
  chunks?: Array<TimeChunk>;
}
