// Generated model: MotionProject
// This file is auto-generated. Do not edit manually.

import { MotionStatus } from './';




export interface MotionProject {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  status: MotionStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  labels?: Array<string>;
  createdTime: string;
  updatedTime: string;
}
