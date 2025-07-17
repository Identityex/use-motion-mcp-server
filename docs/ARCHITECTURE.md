# Motion MCP Server Architecture

## Overview

The Motion MCP Server implements a clean, domain-driven architecture with strict separation of concerns. The system follows functional/reactive programming principles with immutable data structures and pure functions throughout.

## Architectural Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        MCP Protocol Layer                       │
│                    (Model Context Protocol)                     │
├─────────────────────────────────────────────────────────────────┤
│                     Domain Controllers                          │
│   ProjectController | TaskController | WorkflowController      │
│   SyncController | ContextController | DocsController          │
├─────────────────────────────────────────────────────────────────┤
│                    Application Layer                            │
│              Commands        |        Queries                   │
│          (Write Operations)  |   (Read Operations)              │
├─────────────────────────────────────────────────────────────────┤
│                      Service Layer                              │
│     MotionService    |    StorageService    |    AIService     │
└─────────────────────────────────────────────────────────────────┘
```

## Key Design Principles

### 1. Domain-Driven Design (DDD)
- Each domain (projects, tasks, workflow, etc.) has its own controller
- Business logic is encapsulated in domain-specific commands and queries
- Clear boundaries between domains prevent coupling

### 2. CQRS Pattern
- Commands handle write operations (create, update, delete)
- Queries handle read operations (list, search, get)
- Separation allows for different optimization strategies

### 3. Dependency Injection
- All dependencies are injected through constructors
- Enables easy testing with mock implementations
- Centralized dependency configuration in `setup/dependencies.ts`

### 4. OpenAPI-First Development
- Tools and interfaces are generated from OpenAPI schemas
- Type safety is enforced through generated TypeScript interfaces
- Changes start with schema modifications, not code

### 5. Functional Programming
- Pure functions without side effects
- Immutable data structures
- Composable operations

## Code Generation Pipeline

### 1. Schema Definition
```yaml
# schemas/mcp/v1/mcp-tools.yaml
paths:
  /tools/motion.task.create:
    post:
      operationId: createTask
      x-mcp-tool:
        controller: TaskController
```

### 2. Template Processing
```handlebars
# schemas/api-gen/server/mcp-route.mustache
export interface {{{controllerName}}}Controller {
  {{{operationId}}}: (req: {...}) => Promise<MCPToolResponse>;
}
```

### 3. Generated Output
```typescript
// src/api/mcp/v1-routes/routes/TaskControllerRoutes.ts
export interface TaskController {
  createTask: (req: {...}) => Promise<MCPToolResponse>;
}
```

## Domain Controllers

### ProjectController
Handles all project-related MCP tools:
- `listProjects`: Lists projects with pagination
- `createProject`: Creates new projects
- `bindProject`: Binds projects to local storage
- `syncProject`: Syncs project data

### TaskController
Manages task operations:
- `createTask`: Creates tasks with optional AI enhancement
- `listTasks`: Lists tasks with filtering
- `searchTasks`: Searches tasks in local storage
- `updateTask`: Updates task properties
- `completeTask`: Marks tasks as completed
- `moveTask`: Moves tasks between projects
- `enrichTask`: Enhances tasks with AI
- `analyzeTask`: Analyzes task complexity

### WorkflowController
Generates AI-powered workflow plans:
- `planWorkflow`: Creates multi-phase project plans

### SyncController
Manages data synchronization:
- `syncAll`: Syncs all bound projects
- `checkSync`: Checks sync status

### ContextController
Handles AI context management:
- `saveContext`: Saves project context
- `loadContext`: Loads project context

### DocsController
Manages documentation:
- `createDocs`: Creates project documentation
- `updateDocs`: Updates existing docs
- `generateStatusReport`: Generates status reports

## Application Layer

### Commands (Write Operations)
```typescript
export interface TaskCommands {
  readonly createTask: (req: CreateTaskRequest) => Promise<MotionTask>;
  readonly updateTask: (req: UpdateTaskRequest) => Promise<MotionTask>;
  readonly completeTask: (req: CompleteTaskRequest) => Promise<{...}>;
}
```

### Queries (Read Operations)
```typescript
export interface TaskQueries {
  readonly listTasks: (req: ListTasksRequest) => Promise<MotionTask[]>;
  readonly searchTasks: (req: SearchTasksRequest) => Promise<MotionTask[]>;
}
```

## Service Layer

### MotionService
- Handles all Motion API interactions
- Implements rate limiting and retry logic
- Provides typed API methods

### StorageService
- Manages local file operations
- Stores tasks as markdown with YAML frontmatter
- Handles project metadata

### AIService
- Provides AI enhancements
- Task description enrichment
- Workflow planning
- Task analysis

## Data Flow Example

```
1. MCP Client → motion.task.create
2. Server routes to TaskController.createTask()
3. TaskController calls TaskCommands.createTask()
4. TaskCommands uses:
   - AIService (if enrichment requested)
   - MotionService (to create in Motion)
   - StorageService (to save locally)
5. Response flows back through layers
```

## Error Handling

- Each layer handles its specific errors
- Controllers return standardized MCPToolResponse
- Services throw typed errors
- Commands/Queries handle business logic errors

## Testing Strategy

### Unit Tests
- Test individual commands, queries, and services
- Mock dependencies using DI

### Integration Tests
- Test controller → app → service flow
- Use in-memory implementations

### E2E Tests
- Test full MCP tool execution
- Verify Motion API integration

## Security Considerations

- API keys are never logged or exposed
- Input validation at controller layer
- Rate limiting prevents abuse
- Local storage uses safe paths

## Performance Optimizations

- Parallel API calls where possible
- Caching for frequently accessed data
- Lazy loading of large datasets
- Efficient local storage queries

## Future Enhancements

### Planned Features
- WebSocket support for real-time updates
- Batch operations for bulk updates
- Advanced conflict resolution
- Plugin system for extensions

### Scalability Considerations
- Horizontal scaling with shared storage
- Queue-based processing for long operations
- Database backend for large datasets
- Multi-tenant support