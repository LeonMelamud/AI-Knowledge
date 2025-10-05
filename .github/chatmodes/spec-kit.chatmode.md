---
description: 'Spec-driven development mode using GitHub Spec-Kit. Execute structured development workflow with slash commands for constitution, specification, planning, tasks, and implementation.'
tools: []
---

# Spec-Kit Development Mode

A specialized chat mode for spec-driven development using GitHub's Spec-Kit framework. This mode provides structured development workflow through predefined slash commands.

## Available Slash Commands

### Core Workflow Commands

- **`/constitution`** - Create or update project governing principles and development guidelines
- **`/specify`** - Define what you want to build (requirements and user stories)
- **`/plan`** - Create technical implementation plans with your chosen tech stack
- **`/tasks`** - Generate actionable task lists for implementation
- **`/implement`** - Execute all tasks to build the feature according to the plan

### Optional Enhancement Commands

- **`/clarify`** - Clarify underspecified areas (run before `/plan` unless explicitly skipped)
- **`/analyze`** - Cross-artifact consistency & coverage analysis (run after `/tasks`, before `/implement`)

## Development Workflow

### 1. Establish Foundation
```
/constitution Create principles for AI Knowledge Base project focused on:
- Code quality and maintainability standards
- Testing and validation requirements  
- User experience consistency
- Performance and security guidelines
```

### 2. Define Requirements
```
/specify Add automated content management system that can:
- Update hot news from RSS feeds
- Validate YAML/JSON configuration files
- Generate documentation automatically
- Backup and optimize project assets
```

### 3. Create Implementation Plan
```
/plan Use existing Node.js/Express backend architecture with:
- YAML-based configuration system
- Modular task handler design
- GitHub Actions for CI/CD
- VS Code chatmode integration
```

### 4. Generate Tasks
```
/tasks Break down the implementation into actionable items
```

### 5. Execute Implementation
```
/implement Build all features according to the specification and plan
```

## Project Context

This mode is specifically configured for the **AI Knowledge Base** project which includes:

- **Backend**: Node.js/Express server with RSS proxy and token counting
- **Frontend**: Vanilla JavaScript with YAML-driven content system
- **Data**: YAML files for news, concepts, links, and UI translations
- **Infrastructure**: GitHub Pages deployment with custom domain support
- **Features**: Multilingual content (English/Hebrew), hot news updates, AI tool catalog

## File Structure Awareness

The mode understands your project structure:
```
├── public/data/           # YAML configuration files
├── public/js/             # Frontend JavaScript modules
├── server.js              # Main Express server
├── .github/chatmodes/     # Custom chat modes
├── .specify/              # Spec-Kit configuration
└── tasks.json             # Task automation config
```

## Usage Examples

### Adding New Feature
```
@spec-kit /specify Add a new AI model comparison feature that allows users to compare different AI models side-by-side with performance metrics

@spec-kit /plan Integrate with existing YAML data structure and create new comparison view components

@spec-kit /tasks Create implementation steps for the comparison feature
```

### Improving Existing Features
```
@spec-kit /constitution Update principles to include accessibility standards and mobile responsiveness requirements

@spec-kit /specify Enhance the hot news system to support automatic categorization and duplicate detection

@spec-kit /implement Apply the enhancements according to the updated specification
```

## Integration with Existing Tools

This mode works seamlessly with:
- Your existing **@tasks** chatmode for task execution
- **Spec-Kit templates** in `.specify/templates/`
- **Project memory** in `.specify/memory/`
- **GitHub Copilot** code generation capabilities

## Best Practices

1. **Start with Constitution**: Always begin new projects or major features with `/constitution`
2. **Be Specific**: Use detailed descriptions in `/specify` commands
3. **Iterate**: Use `/clarify` when requirements are ambiguous
4. **Validate**: Run `/analyze` before implementation to catch issues early
5. **Document**: Keep specifications updated as the project evolves

## Notes

- All artifacts are stored in `.specify/memory/` for persistence
- The mode respects your existing project structure and conventions
- Specifications can be version-controlled alongside your code
- Commands can be chained together for complete workflow execution