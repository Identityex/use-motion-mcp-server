// Test data factory using Faker.js
// Provides realistic test data for Motion entities

import { faker } from '@faker-js/faker';
import {
  MotionProject,
  MotionTask,
  MotionUser,
  MotionWorkspace,
  MotionStatus,
  CreateProjectRequest,
  CreateTaskRequest,
} from '../../src/types/motion';
import {
  ProjectMeta,
  TaskDocument,
  ProjectContext,
} from '../../src/types/storage';

// Workspace factory
export const createMockWorkspace = (overrides: Partial<MotionWorkspace> = {}): MotionWorkspace => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  type: faker.helpers.arrayElement(['PERSONAL', 'TEAM']),
  ...overrides,
});

// Status factory
export const createMockStatus = (overrides: Partial<MotionStatus> = {}): MotionStatus => ({
  name: faker.helpers.arrayElement(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']),
  isDefaultStatus: faker.datatype.boolean(),
  isResolvedStatus: faker.datatype.boolean(),
  ...overrides,
});

// User factory
export const createMockUser = (overrides: Partial<MotionUser> = {}): MotionUser => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  ...overrides,
});

// Project factory
export const createMockProject = (overrides: Partial<MotionProject> = {}): MotionProject => ({
  id: faker.string.uuid(),
  name: faker.company.buzzPhrase(),
  description: faker.lorem.sentences(2),
  workspaceId: faker.string.uuid(),
  status: createMockStatus({ name: 'Active', isDefaultStatus: true }),
  priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  labels: faker.helpers.arrayElements(['frontend', 'backend', 'urgent', 'enhancement'], { min: 0, max: 3 }),
  createdTime: faker.date.past().toISOString(),
  updatedTime: faker.date.recent().toISOString(),
  ...overrides,
});

// Task factory
export const createMockTask = (overrides: Partial<MotionTask> = {}): MotionTask => ({
  id: faker.string.uuid(),
  name: faker.hacker.phrase(),
  description: faker.lorem.paragraph(),
  priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: createMockStatus({ name: 'TODO' }),
  assigneeId: faker.helpers.maybe(() => faker.string.uuid()),
  projectId: faker.helpers.maybe(() => faker.string.uuid()),
  workspaceId: faker.string.uuid(),
  createdTime: faker.date.past().toISOString(),
  updatedTime: faker.date.recent().toISOString(),
  deadline: faker.helpers.maybe(() => faker.date.future().toISOString()),
  deadlineType: faker.helpers.arrayElement(['SOFT', 'HARD']),
  duration: faker.helpers.maybe(() => faker.number.int({ min: 30, max: 480 })),
  completed: faker.datatype.boolean(),
  labels: faker.helpers.arrayElements(['bug', 'feature', 'test', 'docs'], { min: 0, max: 2 }),
  ...overrides,
});

// CreateProjectRequest factory
export const createMockCreateProjectRequest = (overrides: Partial<CreateProjectRequest> = {}): CreateProjectRequest => ({
  name: faker.company.buzzPhrase(),
  description: faker.lorem.sentences(2),
  workspaceId: faker.string.uuid(),
  priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  labels: faker.helpers.arrayElements(['frontend', 'backend', 'mobile'], { min: 0, max: 2 }),
  ...overrides,
});

// CreateTaskRequest factory
export const createMockCreateTaskRequest = (overrides: Partial<CreateTaskRequest> = {}): CreateTaskRequest => ({
  name: faker.hacker.phrase(),
  description: faker.lorem.paragraph(),
  workspaceId: faker.string.uuid(),
  priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  projectId: faker.helpers.maybe(() => faker.string.uuid()),
  assigneeId: faker.helpers.maybe(() => faker.string.uuid()),
  deadline: faker.helpers.maybe(() => faker.date.future().toISOString()),
  deadlineType: faker.helpers.arrayElement(['SOFT', 'HARD']),
  duration: faker.helpers.maybe(() => faker.number.int({ min: 30, max: 240 })),
  labels: faker.helpers.arrayElements(['urgent', 'enhancement', 'bug'], { min: 0, max: 2 }),
  ...overrides,
});

// ProjectMeta factory
export const createMockProjectMeta = (overrides: Partial<ProjectMeta> = {}): ProjectMeta => ({
  id: faker.string.uuid(),
  name: faker.company.buzzPhrase(),
  workspaceId: faker.string.uuid(),
  lastSyncedAt: faker.date.recent().toISOString(),
  isBound: true,
  localPath: faker.system.directoryPath(),
  ...overrides,
});

// TaskDocument factory
export const createMockTaskDocument = (overrides: Partial<TaskDocument> = {}): TaskDocument => ({
  id: faker.string.uuid(),
  projectId: faker.helpers.maybe(() => faker.string.uuid()),
  workspaceId: faker.string.uuid(),
  name: faker.hacker.phrase(),
  description: faker.lorem.paragraph(),
  status: faker.helpers.arrayElement(['TODO', 'IN_PROGRESS', 'DONE']),
  priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  assigneeId: faker.helpers.maybe(() => faker.string.uuid()),
  duration: faker.helpers.maybe(() => faker.number.int({ min: 30, max: 480 })),
  deadlineType: faker.helpers.maybe(() => faker.helpers.arrayElement(['SOFT', 'HARD'])),
  deadline: faker.helpers.maybe(() => faker.date.future().toISOString()),
  completed: faker.datatype.boolean(),
  labels: faker.helpers.maybe(() => faker.helpers.arrayElements(['bug', 'feature', 'test'], { min: 1, max: 2 })),
  createdTime: faker.date.past().toISOString(),
  updatedTime: faker.date.recent().toISOString(),
  lastSyncedAt: faker.date.recent().toISOString(),
  acceptanceCriteria: faker.helpers.maybe(() => [
    faker.lorem.sentence(),
    faker.lorem.sentence(),
  ]),
  taskDetails: faker.helpers.maybe(() => ({
    autoScheduled: {
      startDate: faker.date.future().toISOString(),
      deadlineType: faker.helpers.arrayElement(['SOFT', 'HARD']),
      schedule: faker.helpers.arrayElement(['Work_Hours', 'All_Day']),
    },
  })),
  ...overrides,
});

// ProjectContext factory
export const createMockProjectContext = (overrides: Partial<ProjectContext> = {}): ProjectContext => ({
  id: faker.string.uuid(),
  name: faker.company.buzzPhrase(),
  description: faker.lorem.paragraph(),
  goals: faker.helpers.maybe(() => [
    faker.company.buzzPhrase(),
    faker.company.buzzPhrase(),
  ]),
  technologies: faker.helpers.maybe(() => faker.helpers.arrayElements(
    ['React', 'Node.js', 'TypeScript', 'Python', 'Docker', 'Kubernetes'],
    { min: 2, max: 4 }
  )),
  architecture: faker.helpers.maybe(() => faker.helpers.arrayElement([
    'Microservices',
    'Monolith',
    'Serverless',
    'Event-driven',
  ])),
  conventions: faker.helpers.maybe(() => [
    'Follow ESLint rules',
    'Use Prettier formatting',
    'Write unit tests',
  ]),
  notes: faker.helpers.maybe(() => [
    faker.lorem.sentence(),
    faker.lorem.sentence(),
  ]),
  lastUpdated: faker.date.recent().toISOString(),
  ...overrides,
});

// Helper to create arrays of entities
export const createMockProjects = (count: number, overrides: Partial<MotionProject> = {}): MotionProject[] =>
  Array.from({ length: count }, () => createMockProject(overrides));

export const createMockTasks = (count: number, overrides: Partial<MotionTask> = {}): MotionTask[] =>
  Array.from({ length: count }, () => createMockTask(overrides));

export const createMockTaskDocuments = (count: number, overrides: Partial<TaskDocument> = {}): TaskDocument[] =>
  Array.from({ length: count }, () => createMockTaskDocument(overrides));

export const createMockUsers = (count: number, overrides: Partial<MotionUser> = {}): MotionUser[] =>
  Array.from({ length: count }, () => createMockUser(overrides));

// Scenario-specific factories
export const createCompletedTask = (overrides: Partial<MotionTask> = {}): MotionTask =>
  createMockTask({
    completed: true,
    status: createMockStatus({ name: 'DONE', isResolvedStatus: true }),
    ...overrides,
  });

export const createOverdueTask = (overrides: Partial<MotionTask> = {}): MotionTask =>
  createMockTask({
    deadline: faker.date.past().toISOString(),
    deadlineType: 'HARD',
    completed: false,
    priority: 'URGENT',
    ...overrides,
  });

export const createHighPriorityProject = (overrides: Partial<MotionProject> = {}): MotionProject =>
  createMockProject({
    priority: 'HIGH',
    labels: ['urgent', 'critical'],
    ...overrides,
  });