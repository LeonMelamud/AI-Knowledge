---
description: 'Structured task execution mode following spec-driven development methodology. Generate, organize, and execute implementation tasks with proper sequencing, dependencies, and parallel execution support.'
tools: []
---

# Task Execution Mode

A systematic approach to task generation and execution following Test-Driven Development (TDD) and structured implementation methodology. Designed for the AI Knowledge Base project with support for parallel execution, dependency management, and progress tracking.

## Task Generation Workflow

### Input Sources
```
1. Implementation Plans (plan.md from @planning mode)
   → Extract tech stack, libraries, structure requirements
2. Design Documents (data-model.md, contracts/, quickstart.md)
   → Generate model tasks, contract tests, integration scenarios
3. Feature Specifications (spec.md)
   → Create user story validation tasks
```

### Task Categories & Phases

#### Phase 1: Setup & Prerequisites
```
- Project structure initialization
- Dependency installation and configuration
- Development environment setup
- Linting and formatting tool configuration
```

#### Phase 2: Tests First (TDD - CRITICAL)
```
⚠️ MUST COMPLETE BEFORE ANY IMPLEMENTATION
- Contract tests for all API endpoints [P]
- Integration tests for user scenarios [P]  
- Unit test scaffolding for core components [P]
- Performance test framework setup
```

#### Phase 3: Core Implementation
```
- Data models and entities [P]
- Service layer and business logic [P]
- API endpoints and controllers
- CLI commands and utilities [P]
```

#### Phase 4: Integration & Polish
```
- Database/storage integration
- Authentication and middleware
- Error handling and logging
- Performance optimization
- Documentation updates [P]
```

## Task Format & Rules

### Task ID System
- **Format**: `[ID] [P?] Description`
- **[P] Flag**: Parallel execution (different files, no dependencies)
- **Sequential**: Tasks without [P] must run in order
- **Numbering**: T001, T002, T003... (sequential across all phases)

### Task Description Standards
```
✅ Good: "Contract test POST /api/users in tests/contract/test_users_post.py"
✅ Good: "User model implementation in src/models/user.py"
❌ Bad: "Add user functionality"
❌ Bad: "Fix the API"
```

### Dependency Rules
```
1. Tests BEFORE Implementation (TDD enforcement)
2. Models BEFORE Services BEFORE Controllers
3. Setup BEFORE Everything else
4. Integration AFTER Core components
5. Documentation AFTER Implementation
```

## Project Structure Awareness

### AI Knowledge Base Architecture
```
├── server.js                     # Main Express server
├── public/
│   ├── data/                     # YAML configuration layer
│   │   ├── news_en.yaml         # Content: Hot news
│   │   ├── concepts_en.yaml     # Content: AI concepts  
│   │   ├── links_en.yaml        # Content: Tool catalog
│   │   └── ui_translations_*.json
│   ├── js/                       # Frontend modules
│   │   ├── main.js              # Core application
│   │   ├── hot-news.js          # News management
│   │   ├── calculator.js        # Token calculation
│   │   └── llm-apis.js          # AI integrations
│   └── css/                      # Styling and assets
├── tests/                        # Test organization
│   ├── contract/                 # API contract tests
│   ├── integration/              # Feature integration tests
│   └── unit/                     # Component unit tests
└── tasks.json                    # Automation configuration
```

### Path Conventions for Task Generation
```
- **Backend**: src/ for new modules, server.js for endpoints
- **Frontend**: public/js/ for new components
- **Data**: public/data/ for YAML schema changes
- **Tests**: tests/{contract,integration,unit}/ by type
- **Docs**: docs/ or README updates
```

## Task Execution Commands

### Generation Commands
```
@tasks generate from-plan [plan-file]
→ Generate tasks from implementation plan

@tasks generate from-spec [feature-name]  
→ Generate tasks from feature specification

@tasks create-phases [feature-name]
→ Create structured task phases for feature
```

### Execution Commands
```
@tasks run [task-id]              # Execute specific task
@tasks run-phase [1|2|3|4]        # Execute entire phase
@tasks run-parallel               # Execute all [P] tasks in current phase
@tasks validate-tdd               # Ensure tests exist before implementation
```

### Management Commands
```
@tasks list                       # Show all tasks with status
@tasks status                     # Current progress and dependencies
@tasks dependencies [task-id]     # Show task dependency graph
@tasks validate                   # Check task completeness and ordering
```

## Example Task Generation

### From Feature: "Add AI Model Comparison"
```
Phase 1: Setup
- [ ] T001 Create comparison feature branch
- [ ] T002 [P] Add comparison data schema to public/data/models.yaml
- [ ] T003 [P] Configure comparison component structure

Phase 2: Tests First (TDD)
- [ ] T004 [P] Contract test GET /api/models/compare in tests/contract/test_compare.py  
- [ ] T005 [P] Integration test model comparison flow in tests/integration/test_comparison.py
- [ ] T006 [P] Unit test comparison logic in tests/unit/test_comparison_service.py

Phase 3: Core Implementation  
- [ ] T007 [P] Model entity in src/models/ai_model.py
- [ ] T008 [P] Comparison service in src/services/comparison_service.py
- [ ] T009 GET /api/models/compare endpoint in server.js
- [ ] T010 [P] Comparison UI component in public/js/comparison.js

Phase 4: Integration
- [ ] T011 Connect comparison service to YAML data layer
- [ ] T012 Add comparison route to main navigation
- [ ] T013 [P] Update API documentation in docs/api.md
```

### Parallel Execution Example
```
# These can run simultaneously (different files):
Task T004: Contract test in tests/contract/test_compare.py
Task T005: Integration test in tests/integration/test_comparison.py  
Task T006: Unit test in tests/unit/test_comparison_service.py

# These must run sequentially (dependencies):
T007 (Model) → T008 (Service) → T009 (Controller)
```

## Task Validation & Gates

### Pre-Implementation Gates
```
✓ All contract tests written and FAILING
✓ Integration test scenarios defined  
✓ Task dependencies properly ordered
✓ No [P] tasks modify same files
✓ All tasks include exact file paths
```

### Completion Validation
```
✓ All tests pass after implementation
✓ No regression in existing functionality
✓ Performance benchmarks met
✓ Documentation updated
✓ Code quality standards maintained
```

## Integration with Other Modes

### With @planning Mode
- Import implementation plans for task generation
- Use architecture decisions for task organization
- Apply project constraints to task design

### With @spec-kit Mode  
- Follow `/tasks` command methodology
- Use Spec-Kit templates for task structure
- Integrate with constitution principles

## TDD Enforcement

### Critical Rules
```
1. NO implementation without failing tests
2. Tests MUST be written first in Phase 2
3. Implementation in Phase 3 ONLY after tests fail
4. Green tests indicate task completion
5. Refactor only after green tests
```

### Validation Commands
```
@tasks check-tdd                  # Verify TDD compliance
@tasks run-tests                  # Execute test suite
@tasks test-status               # Show test pass/fail status
```

## Notes
- All tasks include exact file paths for clarity
- [P] tasks can run in parallel (different files, no dependencies)
- Sequential tasks must complete before next task starts
- Progress tracking shows phase completion and blockers
- Task generation respects existing project structure and conventions

## Constitutional Principles

All task execution follows these principles for the AI Knowledge Base:

### Development Standards
- **Test-Driven Development**: Tests written before implementation
- **Code Quality**: Readable, maintainable, well-documented code
- **Modularity**: Loosely coupled, highly cohesive components  
- **Performance**: Optimized for user experience and efficiency

### Security & Safety
- **Input Validation**: All parameters validated and sanitized
- **File Operations**: Restricted to project directory
- **Backup Strategy**: Create backups before destructive operations
- **Error Handling**: Graceful failure with detailed logging

### Project Consistency  
- **Existing Patterns**: Follow established code conventions
- **Architecture**: Respect current system design
- **Documentation**: Keep docs synchronized with implementation
- **Testing**: Maintain comprehensive test coverage

## Automation Integration

### tasks.json Configuration
The mode also supports automated tasks from `tasks.json`:
```json
{
  "version": "1.0",
  "tasks": [
    {
      "id": "update-news",
      "name": "Update Hot News", 
      "type": "content-update",
      "enabled": true,
      "parameters": {
        "source": "rss",
        "outputFiles": ["public/data/news_en.yaml"],
        "maxItems": 10
      }
    }
  ]
}
```

### Automated Task Types
- **content-update**: Update YAML content from external sources
- **validation**: Check file syntax and structure
- **maintenance**: Backup, cleanup, optimization tasks
- **testing**: Automated test execution and validation

## Example Workflows

### Feature Development
```
@tasks generate from-spec ai-model-comparison
→ Generate TDD task sequence for new feature

@tasks run-phase 2
→ Execute all test creation tasks in parallel

@tasks validate-tdd  
→ Confirm tests are failing before implementation

@tasks run-phase 3
→ Execute implementation tasks to make tests pass
```

### Maintenance Workflow
```
@tasks run update-news
→ Update hot news from RSS feeds

@tasks run validate-data
→ Check all YAML files for errors

@tasks run backup-project
→ Create backup of important files
```