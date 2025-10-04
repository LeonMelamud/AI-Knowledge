# Tasks: React Native Migration

**Input**: Design documents from `/specs/001-react-native-migration/`
**Prerequisites**: plan.md (required), research.md, data-model.md

## Execution Flow (main)
```
1. Load plan.md from feature directory ✅
   → Tech stack: React Native 0.74+, TypeScript 5.0+, Node.js 18+
   → Structure: Mobile + API pattern
2. Load optional design documents: ✅
   → data-model.md: 5 entities (ContentItem, UserPreferences, BookmarkCollection, ContentCache, AppState)
   → research.md: Technology decisions and architecture patterns
3. Generate tasks by category: ✅
   → Setup: React Native project, API transformation, dependencies
   → Tests: Entity models, API endpoints, integration scenarios  
   → Core: Mobile components, services, API endpoints
   → Integration: Offline sync, i18n, accessibility
   → Polish: Performance, E2E tests, app store preparation
4. Apply task rules: ✅
   → Different files = [P] parallel
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001-T028) ✅
6. Generate dependency graph ✅
7. Create parallel execution examples ✅
8. Validate task completeness: ✅
   → All entities have model tests and implementations
   → All API endpoints have contract tests
   → All user scenarios have integration tests
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
Based on plan.md Mobile + API structure:
- **Mobile app**: `mobile/src/`, `mobile/__tests__/`
- **API backend**: `api/src/`, `api/tests/`
- **Data preservation**: `public/data/` (existing YAML files)

## Phase 3.1: Setup & Environment
- [ ] T001 Create React Native project structure in `mobile/` directory with TypeScript template
- [ ] T002 Initialize Node.js API project in `api/` directory with Express and TypeScript
- [ ] T003 [P] Configure ESLint, Prettier, and TypeScript strict mode for `mobile/`
- [ ] T004 [P] Configure ESLint, Prettier, and TypeScript strict mode for `api/`
- [ ] T005 [P] Setup React Native dependencies: React Navigation v6, Zustand, react-i18next, AsyncStorage, js-yaml
- [ ] T006 [P] Setup API dependencies: Express, CORS, helmet, js-yaml, node-cron for content sync
- [ ] T007 [P] Configure YAML schema validation for content files in `public/data/`
- [ ] T008 [P] Setup Jest + React Native Testing Library in `mobile/__tests__/`
- [ ] T009 [P] Setup Jest + Supertest for API testing in `api/tests/`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### API Contract Tests
- [ ] T010 [P] Contract test GET /api/v1/news?lang=en in `api/tests/contract/news.contract.test.js`
- [ ] T011 [P] Contract test GET /api/v1/concepts?lang=he in `api/tests/contract/concepts.contract.test.js`
- [ ] T012 [P] Contract test GET /api/v1/tools?category=nlp in `api/tests/contract/tools.contract.test.js`
- [ ] T013 [P] Contract test GET /api/v1/content/search?q=ml&lang=en in `api/tests/contract/search.contract.test.js`

### Mobile Component Tests
- [ ] T014 [P] Unit test ContentItem model in `mobile/__tests__/models/ContentItem.test.js`
- [ ] T015 [P] Unit test UserPreferences model in `mobile/__tests__/models/UserPreferences.test.js`
- [ ] T016 [P] Unit test BookmarkCollection model in `mobile/__tests__/models/BookmarkCollection.test.js`
- [ ] T017 [P] Unit test ContentCache service in `mobile/__tests__/services/ContentCache.test.js`
- [ ] T018 [P] Unit test YamlProcessor service in `mobile/__tests__/services/YamlProcessor.test.js`

### Integration Tests  
- [ ] T019 [P] Integration test app startup and language selection in `mobile/__tests__/integration/startup.test.js`
- [ ] T020 [P] Integration test offline content access in `mobile/__tests__/integration/offline.test.js`
- [ ] T021 [P] Integration test content search and filtering in `mobile/__tests__/integration/search.test.js`
- [ ] T022 [P] Integration test bookmark management in `mobile/__tests__/integration/bookmarks.test.js`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### API Implementation
- [ ] T023 Transform existing Express server routes to RESTful API in `api/src/routes/`
- [ ] T024 [P] Implement news endpoint with YAML processing in `api/src/routes/news.js`
- [ ] T025 [P] Implement concepts endpoint with multilingual support in `api/src/routes/concepts.js`
- [ ] T026 [P] Implement tools endpoint with filtering in `api/src/routes/tools.js`
- [ ] T027 Implement search endpoint across all content types in `api/src/routes/search.js`

### Mobile Data Models
- [ ] T028 [P] Implement ContentItem model with validation in `mobile/src/models/ContentItem.js`
- [ ] T029 [P] Implement UserPreferences model with AsyncStorage in `mobile/src/models/UserPreferences.js`
- [ ] T030 [P] Implement BookmarkCollection model in `mobile/src/models/BookmarkCollection.js`
- [ ] T031 [P] Implement AppState model for navigation tracking in `mobile/src/models/AppState.js`

### Mobile Services
- [ ] T032 [P] Implement YamlProcessor service for client-side parsing in `mobile/src/services/YamlProcessor.js`
- [ ] T033 [P] Implement ContentCache service with offline support in `mobile/src/services/ContentCache.js`
- [ ] T034 [P] Implement ApiClient service for REST calls in `mobile/src/services/ApiClient.js`
- [ ] T035 Implement SyncService for offline/online synchronization in `mobile/src/services/SyncService.js`

### Mobile Navigation & State
- [ ] T036 Setup Zustand store with persistence in `mobile/src/store/useAppStore.js`
- [ ] T037 [P] Configure React Navigation with deep linking in `mobile/src/navigation/AppNavigator.js`
- [ ] T038 [P] Setup react-i18next with RTL support in `mobile/src/i18n/index.js`

### Mobile Screens
- [ ] T039 [P] Implement HomeScreen with recent content in `mobile/src/screens/HomeScreen.js`
- [ ] T040 [P] Implement NewsScreen with pull-to-refresh in `mobile/src/screens/NewsScreen.js`
- [ ] T041 [P] Implement ConceptsScreen with search in `mobile/src/screens/ConceptsScreen.js`
- [ ] T042 [P] Implement ToolsScreen with filtering in `mobile/src/screens/ToolsScreen.js`
- [ ] T043 [P] Implement SearchScreen with cross-content search in `mobile/src/screens/SearchScreen.js`
- [ ] T044 [P] Implement SettingsScreen with language switching in `mobile/src/screens/SettingsScreen.js`

## Phase 3.4: Integration & Advanced Features
- [ ] T045 Implement network status monitoring with NetInfo in `mobile/src/hooks/useNetworkStatus.js`
- [ ] T046 [P] Setup push notifications with Firebase in `mobile/src/services/NotificationService.js`
- [ ] T047 [P] Implement accessibility features and WCAG compliance in `mobile/src/utils/accessibility.js`
- [ ] T048 Configure content validation middleware in `api/src/middleware/validateContent.js`
- [ ] T049 Setup error boundary and crash reporting in `mobile/src/components/ErrorBoundary.js`

## Phase 3.5: Polish & Optimization
- [ ] T050 [P] Performance optimization: lazy loading and bundle splitting in `mobile/src/utils/performance.js`
- [ ] T051 [P] Implement image caching and optimization in `mobile/src/services/ImageCache.js`
- [ ] T052 [P] E2E tests with Detox for critical user journeys in `mobile/e2e/`
- [ ] T053 [P] Performance tests for startup and loading times in `mobile/__tests__/performance/`
- [ ] T054 [P] App store assets: icons, screenshots, metadata in `mobile/assets/store/`
- [ ] T055 Constitutional compliance verification and documentation in `specs/001-react-native-migration/compliance.md`

## Dependencies

### Critical Path (Sequential)
1. **Setup** (T001-T009) → **Tests** (T010-T022) → **Implementation** (T023-T044) → **Integration** (T045-T049) → **Polish** (T050-T055)

### Specific Dependencies
- **T023** (API transformation) blocks **T024-T027** (API endpoints)
- **T036** (Zustand store) blocks **T037** (navigation) and **T039-T044** (screens)
- **T032-T034** (services) must complete before **T039-T044** (screens that use services)
- **T035** (SyncService) requires **T032-T034** (other services) to be complete

### Blocking Relationships
- All tests (T010-T022) MUST fail before starting implementation (T023+)
- API endpoints (T024-T027) must complete before mobile services (T032-T035)
- Models (T028-T031) must complete before screens (T039-T044)

## Parallel Execution Examples

### Phase 3.2 - All Contract Tests (Run Together)
```bash
# These can run simultaneously - different files:
Task: "Contract test GET /api/v1/news?lang=en in api/tests/contract/news.contract.test.js"
Task: "Contract test GET /api/v1/concepts?lang=he in api/tests/contract/concepts.contract.test.js" 
Task: "Contract test GET /api/v1/tools?category=nlp in api/tests/contract/tools.contract.test.js"
Task: "Unit test ContentItem model in mobile/__tests__/models/ContentItem.test.js"
```

### Phase 3.3 - Data Models (Run Together)  
```bash
# These can run simultaneously - independent files:
Task: "Implement ContentItem model with validation in mobile/src/models/ContentItem.js"
Task: "Implement UserPreferences model with AsyncStorage in mobile/src/models/UserPreferences.js"
Task: "Implement BookmarkCollection model in mobile/src/models/BookmarkCollection.js"
Task: "Implement YamlProcessor service for client-side parsing in mobile/src/services/YamlProcessor.js"
```

### Phase 3.5 - Polish Tasks (Run Together)
```bash  
# These can run simultaneously - different areas:
Task: "Performance optimization: lazy loading and bundle splitting in mobile/src/utils/performance.js"
Task: "Implement image caching and optimization in mobile/src/services/ImageCache.js"
Task: "E2E tests with Detox for critical user journeys in mobile/e2e/"
Task: "App store assets: icons, screenshots, metadata in mobile/assets/store/"
```

## Constitutional Compliance Verification

### Content-Driven Architecture ✅
- **T039-T044**: All screens prioritize content display and search
- **T032, T035**: Services optimize content loading and offline access
- **T021**: Search integration test validates content discoverability

### Multilingual Excellence ✅  
- **T038**: React-i18next with RTL Hebrew support
- **T044**: Settings screen with complete language switching
- **T011**: Hebrew content endpoint contract test

### Test-First Development ✅
- **T010-T022**: All contract and integration tests MUST fail before implementation
- **T052-T053**: E2E and performance tests validate TDD compliance
- **Phase 3.2 → 3.3**: Strict TDD ordering enforced

### YAML-First Data Management ✅
- **T007**: YAML schema validation preserves content structure  
- **T032**: Client-side YAML processing maintains source files
- **T048**: Content validation prevents malformed data

### Performance & Accessibility ✅
- **T047**: WCAG 2.1 AA compliance implementation
- **T053**: Performance tests validate <2s loading requirement
- **T050-T051**: Optimization tasks ensure mobile performance

## Notes
- **[P] tasks** = Different files, no shared dependencies, can run in parallel
- **Sequential tasks** = Same files or dependent on previous completion  
- **Verify all tests FAIL** before implementing corresponding features
- **Commit after each task** to maintain TDD workflow
- **Mobile-first approach** with constitutional compliance throughout

## Validation Checklist
*GATE: All items must be checked before task execution*

- [x] All entities (ContentItem, UserPreferences, BookmarkCollection, ContentCache, AppState) have model tasks
- [x] All API endpoints (/news, /concepts, /tools, /search) have contract tests
- [x] All user scenarios (startup, offline, search, bookmarks) have integration tests  
- [x] All tests come before corresponding implementation tasks
- [x] Parallel tasks ([P]) are truly independent (different files)
- [x] Each task specifies exact file path for implementation
- [x] No [P] task modifies the same file as another [P] task
- [x] Constitutional principles addressed in specific tasks
- [x] TDD workflow enforced with failing tests requirement