````chatmode
---
description: 'Git workflow with pre-commit validation, task progress tracking, and automated quality checks'
tools: []
---

# Git Planning & Validation Mode

Automated Git workflow ensuring code quality, task progress validation, and proper commit/push procedures.

## Core Workflow
```
Pre-Commit → Task Progress → Commit Prep → Quality Gates → Push
```

## Commands

### Validation
- `@git-plan check-files` - File validation & security scan

- `@git-plan task-status` - Progress vs Definition of Done  
- `@git-plan prepare-commit` - Generate conventional commit
- `@git-plan push-ready` - Final validation before push

### Security (Lightweight)
- `@git-plan check-secrets` - Scan for API keys, passwords, tokens
- `@git-plan validate-new-deps` - Check only newly added dependencies

### Automation  
- `@git-plan safe-commit` - Full validation + commit
- `@git-plan safe-push` - Validated push with rollback

## Validation Rules

### File Types
- **JS/Node**: ESLint, syntax, imports, naming conventions
- **YAML**: Syntax, schema, required fields, formatting  
- **JSON**: Syntax, schema, dependencies, versions
- **Markdown**: Linting, links, structure, code blocks

### Security Checks  
- **Secrets Detection**: API keys, passwords, tokens, certificates (pre-commit)
- **New Dependencies**: Quick validation of newly added packages (pre-commit)
- **Comprehensive Security**: Full vulnerability scanning via Snyk in CI/CD
- **License Compliance**: Automated checking in CI pipeline
- **Data Exposure**: PII, credentials, internal URLs

### Quality Gates
- Max complexity: 10, Line length: 120
- Test coverage: >80%, Documentation: required
- Performance benchmarks, No console.log in production

## Task Progress Integration

### File Structure
```
.specify/specs/[feature]/spec.md         - Requirements
.specify/progress/[feature]/progress.json - Progress tracking  
.specify/specs/[feature]/definition-of-done.md - Completion criteria
```

### Progress Validation
1. **Branch Analysis** → Match branch to active task
2. **DoD Check** → Validate against completion criteria  
3. **Progress Calc** → Update completion percentage
4. **Next Actions** → Generate todo items for missing requirements

### DoD Template (Essential Items)
- **Functional**: Core features, error handling, validation
- **Quality**: Tests passing, coverage >80%, security clean
- **Documentation**: API docs, README, code comments  
- **Integration**: No breaking changes, compatibility maintained

## Conventional Commits

### Format
`type(scope): description`

**Types**: feat, fix, docs, style, refactor, test, chore  
**Breaking**: Add `!` after type for breaking changes

### Auto-Generation
- **Analyzes changed files** → Suggests appropriate type/scope
- **File patterns** → `public/js/*` = feat/fix, `tests/*` = test, `docs/*` = docs
- **Smart descriptions** → Based on file content and patterns

### Examples
```
feat(news): add semantic search functionality
fix(calculator): resolve GPT-4 token counting 
docs(api): update authentication endpoints
test(integration): add news feed validation
```

## Quality Gates

### Pre-Commit Hook Flow
```bash
1. File validation (syntax, security)
2. Task progress check (optional warning)  
3. Quality gates (linting, formatting)
4. Test execution
5. Commit approval ✅
```

### Configuration
- **Required**: file_syntax, security_scan, quality_gates, test_execution
- **Optional**: task_progress, documentation_sync, performance_benchmarks
- **Failure**: Block commit, show details, suggest fixes

## Progress Tracking

### Auto-Updates
- **Commit Analysis** → Marks requirements complete based on commit content
- **Progress Calc** → Updates completion percentage
- **Status Check** → Flags task as complete when 100%
- **Next Actions** → Generates todo items for remaining work

### Progress File (JSON)
```json
{
  "task_id": "001-react-native-migration",
  "status": "in_progress", 
  "progress": { "percentage": 67, "phase": "implementation" },
  "completed_items": [...],
  "remaining_items": [...],
  "next_actions": ["Complete component migration", "..."]
}
```

## Error Handling & Recovery

### Failure Response Format
- **Clear Error List** with file:line references
- **Suggested Fixes** with exact commands
- **Next Steps** numbered action plan

### Recovery Commands
- `@git-plan fix-issues` - Auto-fix formatting/syntax
- `@git-plan partial-commit [files]` - Commit only validated files
- `@git-plan skip-task-check` - Override validation (with warning)

## Lightweight Security Commands

### @git-plan check-secrets
```bash
echo "🔍 Checking staged files for secrets..."
git diff --cached --name-only | xargs grep -H -E "(api[_-]?key|password|secret|token|\.env)" 2>/dev/null && echo "⚠️ Potential secrets found!" || echo "✅ No obvious secrets detected"
```

### @git-plan validate-new-deps  
```bash
echo "📦 Checking for newly added dependencies..."
git diff HEAD~1 package.json 2>/dev/null | grep "^\+" | grep -E "\"[^\"]+\":" && echo "🔍 New dependencies detected - full scan in CI" || echo "✅ No new dependencies"
echo "💡 Comprehensive security scanning runs automatically in CI/CD pipeline"
```

## Project Integration

### AI Knowledge Base Rules
- **YAML Files** → Schema validation, translation consistency
- **Frontend JS** → Module patterns, responsive CSS compatibility  
- **Backend** → Express route patterns, API consistency
- **Documentation** → README currency, API doc sync

## Example Workflows

### Development Flow
```
Development → @git-plan check-files → @git-plan task-status → @git-plan safe-commit → @git-plan safe-push
```

### Quick Commit
```
@git-plan safe-commit  # All validation + commit in one step
```

### Release Flow  
```
@git-plan release-validation → version bump → @git-plan tag-release
```

## Constitution Compliance

- **Quality**: Maintainable, tested, secure, performant code
- **Process**: Conventional commits, feature branches, code review
- **Safety**: Backup strategy, rollback capability, audit trail

## CI/CD Security Integration

### 🛡️ Recommended Workflow
```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      - run: npm audit --audit-level=moderate
```

### 💡 Best Practices
- **Pre-commit**: Fast checks (secrets, new deps validation)
- **CI Pipeline**: Comprehensive scans (Snyk, license audit, SAST)
- **Scheduled**: Weekly dependency updates and security reviews
- **Pull Request**: Block merges on high/critical vulnerabilities

### 📋 Setup Instructions
1. Add `SNYK_TOKEN` to repository secrets
2. Use provided `.github/workflows/security-scan.yml`
3. Configure branch protection rules to require security checks
4. Enable Dependabot for automated dependency updates

---
*Integrates with @planning, @tasks, and @spec-kit chatmodes*
````