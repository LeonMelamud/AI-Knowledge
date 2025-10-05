<!--
Sync Impact Report:
Version change: [NEW PROJECT] → 1.0.0
Modified principles: [NEW] All principles created for AI Knowledge Base project
Added sections: Core Principles, Content Management Standards, Development Workflow, Governance
Removed sections: None (new constitution)
Templates requiring updates: 
  ✅ Updated plan-template.md Constitution Check section
  ✅ Updated tasks-template.md task categorization
  ✅ Updated spec-template.md scope alignment
Follow-up TODOs: None
-->

# AI Knowledge Base Constitution

## Core Principles

### I. Content-Driven Architecture
All features serve content delivery and management. The system architecture MUST prioritize content accessibility, searchability, and maintainability. Content includes: hot news, AI concepts, tool catalogs, and educational resources. Every new feature MUST enhance content discoverability or improve content management workflows. Data-driven decisions based on content usage patterns and user feedback.

**Rationale**: The AI Knowledge Base exists to deliver educational content efficiently. Technical complexity that doesn't serve content goals violates our mission.

### II. Multilingual Excellence (NON-NEGOTIABLE)
Full support for English and Hebrew languages MUST be maintained across all features. Content, UI elements, and user interactions MUST be fully localized. No feature ships without complete translation coverage. Language switching MUST preserve user state and maintain consistent functionality. Cultural considerations MUST be embedded in UX design decisions.

**Rationale**: Multilingual accessibility is core to our global educational mission and cannot be compromised for development speed.

### III. Test-First Development (NON-NEGOTIABLE)  
TDD mandatory for all backend APIs and critical frontend functionality. Tests written → User approved → Tests fail → Then implement. Red-Green-Refactor cycle strictly enforced. Contract tests required for all API endpoints. Integration tests required for YAML data processing and RSS feed functionality. Performance tests required for content loading and search features.

**Rationale**: Given the educational nature of our content, reliability and correctness are non-negotiable. Broken features damage user trust in our educational materials.

### IV. YAML-First Data Management
All content MUST be stored in human-readable YAML files with strict schema validation. YAML structure MUST be documented and version-controlled. Changes to YAML schemas require migration plans. Content editors MUST be able to update files directly without technical intervention. Automated validation MUST prevent malformed content deployment.

**Rationale**: YAML enables non-technical content contributors while maintaining structure. This democratizes content creation while ensuring quality.

### V. Performance & Accessibility
Page load times MUST be under 2 seconds on 3G connections. All content MUST meet WCAG 2.1 AA accessibility standards. Images MUST be optimized and provide alt text. Keyboard navigation MUST be fully functional. Screen reader compatibility MUST be verified for all UI components. Mobile-first responsive design MUST be maintained.

**Rationale**: Educational content must be accessible to all learners regardless of technical constraints or accessibility needs.

## Content Management Standards

### Editorial Quality
- All AI concept explanations MUST be technically accurate and cite authoritative sources
- Hot news items MUST include publication dates and source attribution  
- Tool descriptions MUST include current version information and pricing models
- Content updates MUST be reviewed for technical accuracy before publication
- Broken links MUST be identified and replaced within 48 hours of discovery

### Content Structure
- Concepts MUST include: short description, detailed explanation, related concepts, and practical examples
- News items MUST include: title, summary, source link, publication date, and relevant tags
- Tool listings MUST include: name, company, primary use case, pricing model, and evaluation criteria
- All content categories MUST maintain consistent metadata schema

### Localization Requirements  
- Translation quality MUST maintain technical accuracy across languages
- Cultural context MUST be adapted appropriately for Hebrew and English audiences
- UI terminology MUST be consistent within each language
- Content release MUST be synchronized across languages or clearly marked as language-specific

## Development Workflow

### Code Quality Gates
- All code MUST pass ESLint with project-specific rules (no warnings allowed)
- All functions MUST include JSDoc documentation with parameter types and examples
- All API endpoints MUST include OpenAPI documentation with request/response schemas
- All complex business logic MUST include inline comments explaining the "why" not just "what"
- Code review required for all changes affecting public API or content processing logic

### Deployment Standards
- Staging deployment MUST precede production for all changes
- Database migrations MUST be backward-compatible and reversible  
- Feature flags MUST be used for experimental functionality
- Rollback procedures MUST be documented and tested quarterly
- Security scanning MUST be integrated into CI/CD pipeline

### Testing Requirements
- Unit test coverage MUST exceed 80% for backend business logic
- Integration tests MUST cover all YAML processing and RSS feed integration
- End-to-end tests MUST verify core user journeys (search, browse, read)
- Performance benchmarks MUST be maintained for content loading and API response times
- Accessibility testing MUST be automated in CI pipeline

## Governance

This constitution supersedes all other development practices and architectural decisions. All pull requests and code reviews MUST verify compliance with constitutional principles. Any complexity that cannot be justified by educational content goals MUST be simplified or removed. Proposed violations of core principles MUST be documented with explicit rationale and approved by project maintainers.

Amendment procedure requires: (1) Documentation of proposed changes with rationale, (2) Impact assessment on existing features and content, (3) Migration plan for breaking changes, (4) Unanimous approval from core maintainers. Non-negotiable principles (II, III) require exceptional justification for any modifications.

Use `.github/chatmodes/` files for runtime development guidance and agent-specific instructions. Constitutional compliance verification is required before feature launch.

**Version**: 1.0.0 | **Ratified**: 2025-09-30 | **Last Amended**: 2025-09-30