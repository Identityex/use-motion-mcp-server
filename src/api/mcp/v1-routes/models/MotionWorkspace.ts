// Generated model: MotionWorkspace
// This file is auto-generated. Do not edit manually.

import { MotionStatus } from './';



export interface MotionWorkspace {
  id: string;
  name: string;
  teamId?: string;
  type: 'PERSONAL' | 'TEAM';
  statuses: Array<MotionStatus>;
}
