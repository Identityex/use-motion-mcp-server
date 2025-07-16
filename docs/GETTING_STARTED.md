# Getting Started with Motion MCP Server

## Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd motion-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

### 2. Configuration

1. **Get your Motion API key:**
   - Go to https://app.usemotion.com/
   - Navigate to Settings > Integrations > API
   - Create a new API key

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env file with your API key
   ```

3. **Configure Claude Desktop:**
   - Copy the content from `docs/claude-desktop-config.json`
   - Update the absolute path to your installation
   - Add your Motion API key
   - Restart Claude Desktop

### 3. First Use

1. **Test the connection:**
   ```
   motion.project.list
   ```

2. **Bind a project:**
   ```
   motion.project.bind projectId="your-project-id"
   ```

3. **Create a task:**
   ```
   motion.task.create name="My first task" workspaceId="your-workspace-id"
   ```

4. **Sync your data:**
   ```
   motion.sync.all
   ```

## Example Workflow

```markdown
# 1. List all projects to find the one you want to work with
motion.project.list

# 2. Bind the project for local sync
motion.project.bind projectId="proj_123"

# 3. View all tasks in the project
motion.task.list projectId="proj_123"

# 4. Create a new task with AI enrichment
motion.task.create name="Implement user authentication" projectId="proj_123" workspaceId="ws_456" enrichWithAI=true

# 5. Sync all changes
motion.sync.all
```

## Local File Structure

After binding a project, you'll see:

```
.claude/motion/
└── proj_123/
    ├── meta.json
    ├── tasks/
    │   ├── task_1.md
    │   └── task_2.md
    └── docs/
        └── notes.md
```

## Tips and Best Practices

1. **Always bind projects** you're actively working on for the best experience
2. **Use specific filters** when listing tasks to get relevant results
3. **Sync regularly** to keep local and remote data in sync
4. **Use AI enrichment** for complex tasks to get better descriptions
5. **Check sync status** if you're working across multiple devices

## Troubleshooting

- **"API key required" error**: Check your `.env` file and Claude Desktop config
- **Rate limit errors**: The server handles this automatically, but consider upgrading to a team account
- **Sync conflicts**: Use `motion.sync.conflicts` to resolve conflicts manually

## Next Steps

- Explore all available tools with their specific parameters
- Set up project context for better AI assistance
- Create documentation files for your projects
- Automate workflows with batch operations