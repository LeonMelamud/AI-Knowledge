# Task Agent for AI Knowledge Base

A simple chatbot agent mode that executes predefined tasks from `tasks.json` configuration.

## How to Use

1. **Activate the Task Agent Chat Mode**
   - Use `@tasks` to invoke the task agent in GitHub Copilot Chat
   - The agent will automatically read the `tasks.json` configuration

2. **Available Commands**
   ```
   @tasks list           # Show all available tasks
   @tasks run <task-id>  # Execute a specific task
   @tasks status         # Show current task status
   @tasks help          # Show help information
   ```

## Example Tasks Included

### Content Management
- **update-news**: Update hot news content from RSS feeds
- **validate-data**: Check YAML and JSON files for syntax errors
- **generate-docs**: Create API documentation from server code

### Maintenance
- **backup-project**: Create backups of important project files  
- **optimize-assets**: Compress images and minify CSS/JS (disabled by default)

### Testing
- **test-endpoints**: Verify all server endpoints are working correctly

## Task Configuration

Tasks are defined in `tasks.json` with this simple structure:

```json
{
  "id": "unique-task-id",
  "name": "Human Readable Name", 
  "description": "What this task does",
  "type": "task-category",
  "enabled": true,
  "parameters": {
    // Task-specific settings
  }
}
```

## Task Types

- **content-update**: Update content files (YAML, JSON, etc.)
- **validation**: Validate file syntax and structure
- **maintenance**: Backup, cleanup, optimization tasks
- **content-generation**: Generate documentation, reports
- **optimization**: Compress assets, minify files
- **testing**: Test APIs, endpoints, functionality

## Getting Started

1. Make sure `tasks.json` exists in your project root
2. Open GitHub Copilot Chat
3. Type `@tasks list` to see available tasks
4. Run tasks with `@tasks run <task-id>`

The agent will execute tasks using VS Code's built-in capabilities and provide real-time feedback on progress and results.