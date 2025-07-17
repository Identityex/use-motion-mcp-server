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

After restarting Claude Desktop, test the Motion MCP Server:

1. **Verify the server is loaded:**
   - Look for "motion" in the available MCP servers

2. **Test the connection:**
   - Try listing your projects: `Use the motion.project.list tool`

3. **Bind a project for local sync:**
   - First list projects to get the ID
   - Then bind: `Use motion.project.bind with projectId="proj_xxx"`

4. **Create your first task:**
   - `Use motion.task.create with name="My first task" and projectId="proj_xxx"`

## Example Workflow

Here's a typical workflow when using the Motion MCP Server:

1. **List your projects:**
   ```
   Use motion.project.list to see all projects
   ```

2. **Bind a project for local work:**
   ```
   Use motion.project.bind with projectId="proj_123"
   ```

3. **Create tasks with AI assistance:**
   ```
   Use motion.task.batch_create with:
   - goal="Build user authentication system"
   - projectId="proj_123"
   - maxTasks=5
   ```

4. **View project tasks:**
   ```
   Use motion.task.list with projectId="proj_123"
   ```

5. **Enhance a task with AI:**
   ```
   Use motion.task.enrich with taskId="task_456"
   ```

6. **Generate project documentation:**
   ```
   Use motion.docs.create with:
   - projectId="proj_123"
   - type="readme"
   ```

7. **Sync everything:**
   ```
   Use motion.sync.all to sync all bound projects
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

### Common Issues

**"API key required" error**
- Check your `.env` file has `MOTION_API_KEY` set
- Verify the Claude Desktop config includes the API key
- Restart Claude Desktop after configuration changes

**"Tool not found" error**
- Ensure the server is running: `npm run dev`
- Check Claude Desktop logs for connection errors
- Verify the path in claude-desktop-config.json is correct

**Rate limit errors**
- Individual accounts: Limited to 12 requests/minute
- Team accounts: Limited to 120 requests/minute
- Set `MOTION_IS_TEAM_ACCOUNT=true` in config for team accounts

**Project not bound locally**
- Use `motion.project.bind` before sync operations
- Check `.claude/motion/` directory for bound projects

**Sync conflicts**
- Use `motion.sync.check` to identify conflicts
- Force sync with `motion.project.sync` with `force=true`

## Next Steps

- Read the [API Reference](API_REFERENCE.md) for detailed tool documentation
- Review the [Architecture](ARCHITECTURE.md) document to understand the system
- Set up project context with `motion.context.save` for better AI assistance
- Use `motion.workflow.plan` to generate comprehensive project plans
- Create documentation with `motion.docs.create` for your projects
- Automate task creation with `motion.task.batch_create`

## Additional Resources

- [Motion API Documentation](https://docs.usemotion.com/)
- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)
- [Project Repository](https://github.com/your-org/motion-mcp-server)