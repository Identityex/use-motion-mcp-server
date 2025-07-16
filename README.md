# Motion MCP Server

A production-ready MCP (Model Context Protocol) Server that integrates with Motion (usemotion.com) task management platform. This server enables AI assistants to manage projects and tasks through Motion's API while maintaining local context in `.claude/motion/` directory using markdown files.

## Features

### 🎯 **Core Functionality**
- **Full Motion API Integration**: Projects, tasks, workspaces, users, comments
- **Local Storage**: Markdown-based task files with YAML frontmatter
- **Bidirectional Sync**: Keep local and remote data in sync with conflict resolution
- **Rate Limited**: Respects Motion's API limits (12/min individual, 120/min team)

### 🤖 **AI-Powered Features**
- **Task Enrichment**: AI-enhanced descriptions and acceptance criteria
- **Goal Breakdown**: Convert high-level goals into actionable task lists
- **Workflow Planning**: Generate comprehensive project plans
- **Status Reports**: Automated progress summaries

### 📁 **MCP Resources**
- **Project Overviews**: Real-time project status and metrics
- **Task Files**: Individual task details as markdown resources
- **Documentation**: Project docs accessible through MCP
- **AI Prompts**: Templates for task planning and reporting

## Installation

### Prerequisites
- Node.js 18+ and npm
- Motion account with API key
- Claude Desktop (for MCP integration)

### Setup

1. **Clone and Install**
```bash
git clone <repository-url>
cd motion-mcp-server
npm install
```

2. **Configure Environment**
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your Motion API key
MOTION_API_KEY=your_motion_api_key_here
MOTION_IS_TEAM_ACCOUNT=false  # true for team accounts
```

3. **Build the Server**
```bash
npm run build
# or using Make
make build
```

4. **Configure Claude Desktop**
Edit your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "motion": {
      "command": "node",
      "args": ["/absolute/path/to/motion-mcp-server/dist/server/index.js"],
      "env": {
        "MOTION_API_KEY": "your-motion-api-key"
      }
    }
  }
}
```

## Architecture

The server follows a **Controller → App (Commands/Queries) → Services** pattern with Functional/Reactive Programming (FRP) principles:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Controllers   │───▶│   App Layer     │───▶│    Services     │
│   (MCP Tools)   │    │ Commands/Queries│    │ Motion/Storage  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🗂️ **Directory Structure**
```
src/
├── app/                    # Business logic
│   ├── projects/          # Project commands & queries
│   ├── tasks/             # Task commands & queries
│   ├── ai/                # AI-powered features
│   ├── sync/              # Synchronization logic
│   └── docs/              # Documentation generation
├── controllers/           # MCP request handlers
├── services/              # External service integrations
│   ├── motion.service.ts  # Motion API client
│   ├── storage.service.ts # Local file management
│   └── ai.service.ts      # AI enhancements
├── schemas/mcp/           # YAML-based tool definitions
├── resources/             # MCP resources (files, prompts)
└── types/                 # TypeScript interfaces
```

### 🔧 **YAML-Based Tools**
Tools are defined in YAML schemas and automatically generated:

- `src/schemas/mcp/project-tools.yaml` - Project management tools
- `src/schemas/mcp/task-tools.yaml` - Task operation tools
- `src/schemas/mcp/ai-tools.yaml` - AI-powered tools
- `src/schemas/mcp/sync-tools.yaml` - Sync and context tools
- `src/schemas/mcp/docs-tools.yaml` - Documentation tools

## Available Tools

### 📋 **Project Management**
- `motion.project.list` - List all projects with pagination
- `motion.project.create` - Create new projects
- `motion.project.bind` - Bind project to local storage
- `motion.project.sync` - Sync project with Motion

### ✅ **Task Operations**
- `motion.task.create` - Create tasks (with AI enrichment)
- `motion.task.list` - List and filter tasks
- `motion.task.search` - Search tasks in local storage
- `motion.task.update` - Update task properties
- `motion.task.complete` - Mark tasks as completed

### 🤖 **AI Features**
- `motion.task.enrich` - AI-enhance task descriptions
- `motion.task.batch_create` - Create multiple tasks from goals
- `motion.task.analyze` - Analyze task complexity
- `motion.workflow.plan` - Generate comprehensive plans

### 🔄 **Sync & Context**
- `motion.sync.all` - Sync all bound projects
- `motion.sync.check` - Check sync status
- `motion.context.save` - Save project context for AI
- `motion.context.load` - Load project context

### 📄 **Documentation**
- `motion.docs.create` - Generate project documentation
- `motion.docs.update` - Update existing docs
- `motion.status.report` - Generate status reports

## Local Storage Structure

The server maintains local context in `.claude/motion/`:

```
.claude/motion/
└── [project-id]/
    ├── meta.json         # Project metadata
    ├── tasks/
    │   └── [task-id].md  # Task files with YAML frontmatter
    └── docs/
        └── *.md          # Project documentation
```

### Task File Format
```markdown
---
id: task_123
projectId: proj_456
status: In Progress
priority: HIGH
duration: 120
# ... other metadata
---

# Task Title

## Description
Detailed task description...

## Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2
```

## Development

### 🛠️ **Build Commands (Make)**
```bash
make help          # Show all available commands
make install       # Install dependencies
make build         # Build the project
make test          # Run tests
make lint          # Run linter
make dev           # Start development server
make check         # Run all quality checks
make docker-build  # Build Docker image
```

### 🔍 **Testing**
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test files
npm test -- --testPathPattern=tasks
```

### 📊 **Monitoring**
The server includes comprehensive error handling and logging:
- Request/response logging
- Rate limit monitoring
- Sync conflict detection
- Validation error reporting

## Docker Deployment

### Build and Run
```bash
# Build image
make docker-build

# Run container
docker run -it --rm \
  -v "${PWD}/.claude:/app/.claude" \
  -e MOTION_API_KEY="your-api-key" \
  motion-mcp-server
```

### Docker Compose
```yaml
version: '3.8'
services:
  motion-mcp:
    build: .
    volumes:
      - ./.claude:/app/.claude
    environment:
      - MOTION_API_KEY=${MOTION_API_KEY}
      - MOTION_IS_TEAM_ACCOUNT=false
```

## Configuration

### Environment Variables
```bash
MOTION_API_KEY=              # Required: Your Motion API key
MOTION_IS_TEAM_ACCOUNT=      # Rate limit configuration
MOTION_BASE_URL=             # Motion API base URL
REQUEST_TIMEOUT=             # API request timeout (ms)
CLAUDE_DATA_DIR=             # Local storage directory
LOG_LEVEL=                   # Logging verbosity
```

### Rate Limiting
The server automatically detects account type and applies appropriate limits:
- **Individual accounts**: 12 requests/minute
- **Team accounts**: 120 requests/minute

## Troubleshooting

### Common Issues

#### ❌ **"Motion API key not found"**
```bash
# Check environment variables
echo $MOTION_API_KEY

# Verify .env file
cat .env
```

#### ❌ **"Project not bound locally"**
```bash
# First bind the project
# Use motion.project.bind tool in Claude
```

#### ❌ **Rate limit exceeded**
```bash
# Check if team account flag is correct
MOTION_IS_TEAM_ACCOUNT=true  # For team accounts
```

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=debug
npm start
```

## API Reference

The server implements all major Motion API endpoints:
- [Projects API](https://docs.usemotion.com/api-reference/projects/)
- [Tasks API](https://docs.usemotion.com/api-reference/tasks/)
- [Workspaces API](https://docs.usemotion.com/api-reference/workspaces/)
- [Users API](https://docs.usemotion.com/api-reference/users/)
- [Comments API](https://docs.usemotion.com/api-reference/comments/)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run quality checks: `make check`
6. Submit a pull request

### Code Style
- TypeScript with strict mode
- Functional/Reactive Programming patterns
- Immutable data structures
- Pure functions without side effects

## License

MIT License - see LICENSE file for details.

## Support

- 📚 [Motion API Documentation](https://docs.usemotion.com/)
- 🔧 [MCP Specification](https://spec.modelcontextprotocol.io/)
- 🐛 [Report Issues](https://github.com/your-org/motion-mcp-server/issues)

---

**Built with ❤️ for the Claude ecosystem**