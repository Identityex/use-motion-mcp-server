# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build System

- `make help` - Show all available commands 
- `make install` - Install dependencies
- `make build` - Build the project (includes OpenAPI generation)
- `make dev` - Start development server
- `make test` - Run tests
- `make lint` - Run linter
- `make typecheck` - Run TypeScript type checking
- `make check` - Run all quality checks (lint + typecheck + test)

### OpenAPI Code Generation

- `make openapi` - Generate all routes from YAML schemas
- `make v1-routes` - Generate v1 MCP routes specifically
- `make openapi-force` - Force regenerate all OpenAPI files

### Testing

- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm test -- --testPathPattern=tasks` - Run specific test files

### Alternative Commands

- `npm run dev` - Start development server (alternative to make dev)
- `npm run lint:fix` - Run linter with auto-fix
- `npm run build` - Build without OpenAPI generation
- `npm run typecheck` - Run TypeScript type checking

## Architecture

This is a **Motion MCP Server** with strict architectural layers:

```
Domain Controllers → App (Commands/Queries) → Services
```

### Key Architectural Principles

1. **OpenAPI-First Development**: All MCP tools are defined in YAML schemas and generated automatically
2. **Domain-Driven Design**: Separate controllers for each domain (projects, tasks, workflow, sync, context, docs)
3. **Controller → App → Services Pattern**: Strict layering with dependency injection
4. **FRP (Functional/Reactive Programming)**: Pure functions, immutable data structures
5. **CQRS Pattern**: Commands and queries separated within each domain

### Directory Structure

```
src/
├── api/mcp/v1-routes/          # Generated OpenAPI code
│   ├── models/                 # Generated TypeScript interfaces
│   ├── routes/                 # Generated controller interfaces  
│   └── tools.ts                # Generated MCP tool schemas
├── api/mcp/v1-controllers/     # Domain controller implementations
│   ├── project-controller.ts   # Project domain controller
│   ├── task-controller.ts      # Task domain controller
│   ├── workflow-controller.ts  # Workflow domain controller
│   ├── sync-controller.ts      # Sync domain controller
│   ├── context-controller.ts   # Context domain controller
│   ├── docs-controller.ts      # Documentation domain controller
│   └── index.ts                # Controller exports
├── app/                        # Business logic layer
│   ├── motion/                 # Motion API commands & queries
│   ├── tasks/                  # Task commands & queries
│   ├── projects/               # Project commands & queries
│   ├── workflow/               # Workflow commands
│   ├── sync/                   # Sync commands
│   ├── context/                # Context commands
│   └── docs/                   # Documentation commands
├── services/                   # External service integrations
│   ├── motion-service.ts       # Motion API client
│   ├── storage/                # Local file management
│   └── ai/                     # AI enhancements
├── setup/                      # Configuration and DI
│   └── dependencies.ts         # Dependency injection setup
└── server/index.ts             # MCP server entry point
```

### Code Generation Pipeline

The project uses **custom Handlebars templates** instead of default OpenAPI generators:

1. **Schema Definition**: `schemas/mcp/v1/*.yaml` - OpenAPI schemas with MCP tool definitions
2. **Template Processing**: `schemas/api-gen/server/*.mustache` - Custom Handlebars templates
3. **Generation Script**: `scripts/generate-mcp-routes.js` - Custom generation logic
4. **Output**: `src/api/mcp/v1-routes/` - Generated TypeScript interfaces and tools

### Generated Files (Do Not Edit)

- `src/api/mcp/v1-routes/models/*.ts` - Generated model interfaces
- `src/api/mcp/v1-routes/tools.ts` - Generated MCP tool schemas
- `src/api/mcp/v1-routes/routes/*ControllerRoutes.ts` - Generated controller interfaces

### Domain Controllers

Each domain has its own controller that handles MCP tool requests:

- **ProjectController**: Handles project listing, creation, binding, and syncing
- **TaskController**: Manages task CRUD operations, search, and AI enhancements
- **WorkflowController**: Generates workflow plans using AI
- **SyncController**: Manages bidirectional sync and conflict resolution
- **ContextController**: Saves and loads project context for AI assistance
- **DocsController**: Creates and updates project documentation

### Local Storage Structure

Tasks and projects are stored locally in `.claude/motion/`:

```
.claude/motion/
└── [project-id]/
    ├── meta.json         # Project metadata
    ├── tasks/
    │   └── [task-id].md  # Task files with YAML frontmatter
    ├── docs/             # Project documentation
    └── context.md        # AI context
```

## Key Implementation Details

### MCP Tool Mapping

The server maps MCP tool names to domain controllers in `src/server/index.ts`:
- Tool names follow the pattern: `motion.{domain}.{action}`
- Each tool is routed to the appropriate domain controller
- Example: `motion.task.create` → `taskController.createTask()`

### Controller Interface Generation

Controllers implement interfaces generated from OpenAPI schemas:
- Each route file defines a controller interface (e.g., `ProjectController`)
- Controllers return `MCPToolResponse` with standardized format
- Type safety is enforced through generated interfaces

### Type System Simplification

Complex ID types are mapped to simple strings:
- `ProjectID` → `string`
- `TaskID` → `string`
- `UserID` → `string`
- Enums like `Priority` and `Status` are inlined

### Motion API Integration

The motion service integration (created via `createMotionService` function) handles all Motion API interactions:
- Rate limiting (12/min individual, 120/min team accounts) via `MotionClient`
- Automatic retry with exponential backoff using p-retry
- Request/response logging with performance tracking
- Error handling with meaningful messages and sanitization
- Distributed rate limit tracking and intelligent delays

### HTML Escaping Fix

Handlebars templates use triple mustaches `{{{value}}}` to prevent HTML entity escaping in generated code.

## Common Tasks

### Adding New MCP Tools

1. Define the tool in `schemas/mcp/v1/mcp-tools.yaml`
2. Run `make openapi` to regenerate code
3. Implement the controller method in the appropriate domain controller
4. Add the tool mapping in `src/server/index.ts`

### Creating a New Domain Controller

1. Create a new controller file in `src/api/mcp/v1-controllers/`
2. Implement the controller interface from generated routes
3. Add the controller to `src/setup/dependencies.ts`
4. Map tools to the controller in `src/server/index.ts`

### Modifying Generated Code

Never edit generated files directly. Instead:
1. Update the YAML schema in `schemas/mcp/v1/`
2. Modify Handlebars templates in `schemas/api-gen/server/`
3. Update the generation script in `scripts/generate-mcp-routes.js`
4. Run `make openapi-force` to regenerate

### Adding New Services

1. Create the service in `src/services/`
2. Add it to the dependency injection in `src/setup/dependencies.ts`
3. Inject it into the appropriate app layer commands/queries

### AI Service Architecture

The AI service uses a provider-based architecture for flexibility:

```
src/services/ai/
├── ai-service.ts          # Main service interface and implementation
├── providers/             # AI provider implementations
│   ├── base-provider.ts   # Abstract base class for all providers
│   ├── openai-provider.ts # OpenAI GPT integration
│   ├── anthropic-provider.ts # Anthropic Claude integration
│   ├── mock-provider.ts   # Mock provider for testing/offline use
│   └── provider-factory.ts # Factory for creating providers
└── prompts/               # Structured prompts for consistency
    ├── task-prompts.ts    # Task-related AI prompts
    ├── workflow-prompts.ts # Workflow planning prompts
    └── docs-prompts.ts    # Documentation generation prompts
```

Key features:
- **Multiple Provider Support**: OpenAI, Anthropic, or mock providers
- **Structured Output**: Uses Zod schemas for type-safe AI responses
- **Prompt Engineering**: Centralized, tested prompts for consistency
- **Graceful Degradation**: Falls back to mock provider when AI unavailable
- **Token Management**: Built-in token counting for rate limiting

## Environment Configuration

Required environment variables:
- `MOTION_API_KEY` - Motion API key (required)
- `MOTION_IS_TEAM_ACCOUNT` - true for team accounts (affects rate limiting)
- `MOTION_BASE_URL` - Motion API base URL (optional)
- `MOTION_WORKSPACE_ID` - Default workspace ID (optional)

AI Service configuration (optional):
- `AI_PROVIDER` - AI provider to use: `openai`, `anthropic`, `mock` (default: `mock`)
- `AI_API_KEY` - API key for AI provider
- `AI_MODEL` - Model to use (defaults: `gpt-4o-mini` for OpenAI, `claude-3-haiku-20240307` for Anthropic)
- `AI_BASE_URL` - Custom base URL for self-hosted AI providers

## Testing Strategy

- **Unit Tests**: Test individual commands, queries, and services
- **Integration Tests**: Test controller → app → service flow
- **E2E Tests**: Test full MCP tool execution
- **Mock Services**: Use dependency injection for easy mocking

## Integration with Motion API

The server implements comprehensive Motion API integration:
- Projects API (list, create, update)
- Tasks API (CRUD operations, auto-scheduling)
- Workspaces API (team/personal account detection)
- Users API (assignee management)
- Comments API (task discussions)

All API calls respect Motion's rate limits and include proper error handling.

## Best Practices

1. **Pure Functions**: Keep all business logic in pure functions
2. **Immutable Data**: Never mutate data structures
3. **Error Handling**: Use Result types or throw meaningful errors
4. **Type Safety**: Leverage TypeScript's type system fully
5. **Domain Separation**: Keep domains isolated from each other
6. **Dependency Injection**: Use DI for testability and flexibility