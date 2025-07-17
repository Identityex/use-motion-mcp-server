# Motion MCP Server API Reference

## Overview

The Motion MCP Server exposes tools through the Model Context Protocol (MCP). All tools follow the naming pattern `motion.{domain}.{action}`.

## Project Tools

### motion.project.list

Lists all projects with optional filtering and pagination.

**Parameters:**
- `workspaceId` (string, optional): Filter by workspace ID
- `limit` (number, optional): Maximum results (1-100, default: 50)
- `cursor` (string, optional): Pagination cursor

**Response:**
```json
{
  "success": true,
  "data": [{
    "id": "proj_123",
    "name": "Project Name",
    "description": "Project description",
    "workspaceId": "ws_456",
    "status": "PLANNING",
    "priority": "HIGH",
    "createdTime": "2024-01-01T00:00:00Z",
    "updatedTime": "2024-01-01T00:00:00Z"
  }],
  "count": 1
}
```

### motion.project.create

Creates a new project in Motion.

**Parameters:**
- `name` (string, required): Project name
- `description` (string, optional): Project description
- `workspaceId` (string, optional): Target workspace ID

**Response:**
```json
{
  "success": true,
  "message": "Project \"My Project\" created successfully",
  "data": { /* project object */ }
}
```

### motion.project.bind

Binds a project to local storage for offline access and sync.

**Parameters:**
- `projectId` (string, required): Project ID to bind

**Response:**
```json
{
  "success": true,
  "message": "Project proj_123 bound to local storage",
  "data": {
    "projectId": "proj_123",
    "localPath": ".claude/motion/proj_123"
  }
}
```

### motion.project.sync

Synchronizes a bound project with Motion.

**Parameters:**
- `projectId` (string, required): Project ID to sync
- `force` (boolean, optional): Force sync even with conflicts

**Response:**
```json
{
  "success": true,
  "message": "Synced 5 tasks for project proj_123",
  "data": {
    "projectId": "proj_123",
    "syncedTasks": 5,
    "conflicts": []
  }
}
```

## Task Tools

### motion.task.create

Creates a new task with optional AI enhancement.

**Parameters:**
- `name` (string, required): Task name
- `description` (string, optional): Task description
- `projectId` (string, optional): Project to assign task to
- `priority` (string, optional): LOW, MEDIUM, HIGH, URGENT
- `duration` (number, optional): Duration in minutes
- `dueDate` (string, optional): ISO date string
- `enrich` (boolean, optional): Use AI to enhance description

**Response:**
```json
{
  "success": true,
  "message": "Task \"Implement feature\" created successfully",
  "data": { /* task object */ }
}
```

### motion.task.batch_create

Creates multiple tasks from a high-level goal using AI.

**Parameters:**
- `goal` (string, required): High-level goal description
- `projectId` (string, required): Project ID for tasks
- `maxTasks` (number, optional): Maximum tasks to create (default: 5)
- `context` (string, optional): Additional context for AI

**Response:**
```json
{
  "success": true,
  "message": "Created 5 tasks from goal",
  "data": {
    "tasks": [
      {"id": "task_1", "name": "Research requirements"},
      {"id": "task_2", "name": "Design architecture"}
    ]
  }
}
```

### motion.task.list

Lists tasks with flexible filtering options.

**Parameters:**
- `projectId` (string, optional): Filter by project
- `status` (string, optional): TODO, IN_PROGRESS, COMPLETED, CANCELLED
- `limit` (number, optional): Maximum results (1-100)
- `cursor` (string, optional): Pagination cursor

**Response:**
```json
{
  "success": true,
  "data": [{ /* task objects */ }],
  "count": 10
}
```

### motion.task.search

Searches tasks in local storage using text queries.

**Parameters:**
- `query` (string, required): Search query
- `projectId` (string, optional): Limit to specific project
- `status` (string, optional): Filter by status

**Response:**
```json
{
  "success": true,
  "data": [{ /* matching tasks */ }],
  "count": 3
}
```

### motion.task.update

Updates task properties.

**Parameters:**
- `taskId` (string, required): Task ID to update
- `name` (string, optional): New name
- `description` (string, optional): New description
- `status` (string, optional): New status
- `priority` (string, optional): New priority
- `dueDate` (string, optional): New due date
- `duration` (number, optional): New duration

**Response:**
```json
{
  "success": true,
  "message": "Task \"Updated name\" updated successfully",
  "data": { /* updated task */ }
}
```

### motion.task.complete

Marks a task as completed.

**Parameters:**
- `taskId` (string, required): Task ID to complete

**Response:**
```json
{
  "success": true,
  "message": "Task task_123 marked as completed",
  "data": {
    "taskId": "task_123",
    "completed": true
  }
}
```

### motion.task.move

Moves a task to a different project.

**Parameters:**
- `taskId` (string, required): Task ID to move
- `targetProjectId` (string, required): Target project ID

**Response:**
```json
{
  "success": true,
  "message": "Task task_123 moved to project proj_456",
  "data": {
    "taskId": "task_123",
    "newProjectId": "proj_456"
  }
}
```

### motion.task.enrich

Enhances task description using AI.

**Parameters:**
- `taskId` (string, required): Task ID to enrich
- `context` (string, optional): Additional context for AI

**Response:**
```json
{
  "success": true,
  "message": "Task task_123 enhanced with AI",
  "data": {
    "taskId": "task_123",
    "enhanced": true
  }
}
```

### motion.task.analyze

Analyzes task complexity and estimates duration using AI.

**Parameters:**
- `taskId` (string, required): Task ID to analyze

**Response:**
```json
{
  "success": true,
  "message": "Task task_123 analyzed",
  "data": {
    "taskId": "task_123",
    "complexity": "MEDIUM",
    "estimatedDuration": 120
  }
}
```

## Workflow Tools

### motion.workflow.plan

Generates a comprehensive workflow plan using AI.

**Parameters:**
- `goal` (string, required): Project goal description
- `projectId` (string, required): Project ID
- `context` (string, optional): Additional context
- `constraints` (object, optional): Planning constraints

**Response:**
```json
{
  "success": true,
  "message": "Workflow plan generated with 3 phases",
  "data": {
    "plan": {
      "phases": [
        {
          "name": "Research Phase",
          "tasks": [/* task definitions */],
          "duration": 5
        }
      ]
    }
  }
}
```

## Sync Tools

### motion.sync.all

Synchronizes all bound projects with Motion.

**Parameters:** None

**Response:**
```json
{
  "success": true,
  "message": "Synced 3 projects with 25 total tasks",
  "data": {
    "syncedProjects": 3,
    "syncedTasks": 25,
    "errors": []
  }
}
```

### motion.sync.check

Checks synchronization status for conflicts.

**Parameters:**
- `projectId` (string, optional): Check specific project

**Response:**
```json
{
  "success": true,
  "message": "Local and remote are in sync",
  "data": {
    "outOfSync": false,
    "conflicts": []
  }
}
```

## Context Tools

### motion.context.save

Saves project context for AI assistance.

**Parameters:**
- `projectId` (string, required): Project ID
- `context` (string, required): Context content

**Response:**
```json
{
  "success": true,
  "message": "Context saved for project proj_123",
  "data": {
    "projectId": "proj_123",
    "contextPath": ".claude/motion/proj_123/context.md"
  }
}
```

### motion.context.load

Loads saved project context.

**Parameters:**
- `projectId` (string, required): Project ID

**Response:**
```json
{
  "success": true,
  "message": "Context loaded for project proj_123",
  "data": {
    "projectId": "proj_123",
    "context": "Project context content..."
  }
}
```

## Documentation Tools

### motion.docs.create

Creates project documentation.

**Parameters:**
- `projectId` (string, required): Project ID
- `type` (string, required): readme, architecture, api, user-guide
- `template` (string, optional): Custom template

**Response:**
```json
{
  "success": true,
  "message": "Documentation created: readme",
  "data": {
    "docId": "readme",
    "path": ".claude/motion/proj_123/docs/README.md"
  }
}
```

### motion.docs.update

Updates existing documentation.

**Parameters:**
- `projectId` (string, required): Project ID
- `docId` (string, required): Document ID
- `content` (string, required): New content

**Response:**
```json
{
  "success": true,
  "message": "Documentation updated: readme",
  "data": {
    "docId": "readme",
    "updated": true
  }
}
```

### motion.status.report

Generates a project status report.

**Parameters:**
- `projectId` (string, required): Project ID
- `format` (string, optional): markdown, json, summary
- `includeMetrics` (boolean, optional): Include metrics

**Response:**
```text
# Project Status Report

## Overview
Project: My Project
Status: IN_PROGRESS
Progress: 45% (9/20 tasks completed)

## Recent Activity
- Completed "Design UI mockups" (2 days ago)
- Started "Implement backend API" (today)

## Upcoming Tasks
- Code review (due in 3 days)
- Deploy to staging (due in 5 days)
```

## Error Responses

All tools return consistent error responses:

```json
{
  "content": [{
    "type": "text",
    "text": "Error: Task not found"
  }],
  "isError": true
}
```

Common error types:
- Missing required parameters
- Invalid parameter values
- Resource not found
- API rate limit exceeded
- Network connectivity issues
- Permission denied

## Rate Limiting

The server respects Motion's API rate limits:
- Individual accounts: 12 requests per minute
- Team accounts: 120 requests per minute

Rate limit errors are automatically retried with exponential backoff.