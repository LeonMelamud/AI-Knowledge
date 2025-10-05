# Data Model: React Native Migration

**Generated**: 2025-09-30  
**Purpose**: Entity definitions and relationships for mobile AI Knowledge Base

## Core Entities

### ContentItem
Represents all content types in the system (news, concepts, tools).

**Fields**:
- `id: string` - Unique identifier (YAML filename + language)
- `type: 'news' | 'concept' | 'tool'` - Content category
- `language: 'en' | 'he'` - Content language
- `title: string` - Display title
- `description: string` - Short summary or excerpt
- `content: string` - Full content body (markdown supported)
- `tags: string[]` - Categorization and search tags
- `publishedDate: Date` - Publication or creation date
- `updatedDate: Date` - Last modification date
- `sourceUrl?: string` - External link for news items
- `metadata: Record<string, any>` - Type-specific additional data

**Relationships**:
- Self-referential: Related concepts, similar tools
- Many-to-many with BookmarkCollection (favorited by users)
- One-to-many with SearchHistory (searched content)

**Validation Rules**:
- Title required, max 200 characters
- Description required, max 500 characters
- Content required for concepts and tools
- Source URL required for news items
- Tags must be non-empty array
- Published date cannot be future
- Language must be supported locale

**State Transitions**:
- Draft → Published (content creation workflow)
- Published → Archived (outdated content)
- Offline ↔ Synced (connectivity-based states)

### UserPreferences
Stores user configuration and personalization settings.

**Fields**:
- `language: 'en' | 'he'` - Selected interface language
- `theme: 'light' | 'dark' | 'system'` - Visual theme preference
- `notificationsEnabled: boolean` - Push notification setting
- `newsCategories: string[]` - Subscribed news topics
- `accessibilitySettings: AccessibilityConfig` - Screen reader, text size, etc.
- `cacheSettings: CacheConfig` - Offline storage preferences
- `syncFrequency: 'realtime' | 'hourly' | 'daily'` - Update frequency

**Relationships**:
- One-to-one with AppState
- One-to-many with BookmarkCollection

**Validation Rules**:
- Language must be supported
- Theme must be valid option
- News categories must exist in system
- Cache size limits enforced
- Sync frequency must be valid option

**State Transitions**:
- Default → Personalized (first-time user onboarding)
- Synced → Pending Sync (offline changes)
- Active → Migrating (preference updates)

### BookmarkCollection
User-curated list of favorite content items.

**Fields**:
- `id: string` - Unique collection identifier
- `userId?: string` - Optional user identifier (future account system)
- `items: BookmarkItem[]` - List of bookmarked content
- `createdDate: Date` - Collection creation time
- `lastModified: Date` - Last bookmark change

**BookmarkItem Sub-entity**:
- `contentId: string` - Reference to ContentItem
- `addedDate: Date` - When item was bookmarked
- `category?: string` - User-defined category
- `notes?: string` - Personal notes about item
- `readStatus: 'unread' | 'reading' | 'completed'` - Progress tracking

**Relationships**:
- Many-to-many with ContentItem (bookmarked items)
- Many-to-one with UserPreferences

**Validation Rules**:
- Maximum 1000 bookmarks per collection
- Content ID must reference existing item
- Category names max 50 characters
- Notes max 500 characters
- Duplicate bookmarks prevented

**State Transitions**:
- Empty → Active (first bookmark added)
- Active → Syncing (offline changes uploaded)
- Active → Archived (user data cleanup)

### ContentCache
Local storage management for offline content access.

**Fields**:
- `contentType: 'news' | 'concepts' | 'tools' | 'search'` - Cached content category
- `language: 'en' | 'he'` - Content language
- `data: ContentItem[]` - Cached content array
- `lastUpdated: Date` - Most recent sync time
- `expirationDate: Date` - When cache becomes stale
- `syncVersion: string` - Server version for conflict resolution
- `isStale: boolean` - Whether cache needs refresh
- `sizeBytes: number` - Storage usage tracking

**Relationships**:
- Contains references to ContentItem entities
- Managed by SyncService

**Validation Rules**:
- Expiration date must be future
- Size cannot exceed device limits
- Version must be valid semver format
- Language must be supported

**State Transitions**:
- Empty → Loading (initial cache population)
- Fresh → Stale (time-based expiration)
- Stale → Refreshing (background sync)
- Refreshing → Fresh (sync completion)
- Any → Corrupted → Empty (error recovery)

### AppState
Current application context and navigation state.

**Fields**:
- `currentScreen: string` - Active screen identifier
- `navigationHistory: string[]` - Screen navigation stack
- `searchHistory: SearchQuery[]` - Recent search terms
- `lastActiveDate: Date` - Application last used time
- `sessionStartTime: Date` - Current session start
- `backgroundTime?: Date` - When app was backgrounded
- `deepLinkContext?: string` - Pending deep link navigation
- `errorState?: ErrorInfo` - Current error information

**SearchQuery Sub-entity**:
- `query: string` - Search terms
- `contentTypes: string[]` - Searched categories
- `timestamp: Date` - When search was performed
- `resultCount: number` - Number of results found

**Relationships**:
- One-to-one with UserPreferences
- References current ContentItem being viewed

**Validation Rules**:
- Navigation history max 50 screens
- Search history max 100 queries
- Screen names must be valid routes
- Session time tracking accuracy required

**State Transitions**:
- Inactive → Active (app launch)
- Active → Background (app backgrounded)
- Background → Active (app foregrounded)
- Any → Error → Recovery (error handling)

## Entity Relationships Diagram

```
UserPreferences (1) ←→ (1) AppState
       ↓ (1)
       ↓
BookmarkCollection (M) ←→ (M) ContentItem
       ↑                      ↑
       │                      │
       └── SearchHistory ──────┘
                ↓
         ContentCache (contains) ContentItem references
```

## Data Flow Patterns

### Content Loading Flow
1. App requests content by type and language
2. Check ContentCache for fresh data
3. If cache hit: return cached ContentItems
4. If cache miss/stale: fetch from API
5. Update ContentCache with new data
6. Return ContentItems to UI

### Bookmark Management Flow
1. User selects content to bookmark
2. Validate ContentItem exists
3. Create BookmarkItem in BookmarkCollection
4. Update local storage immediately
5. Queue sync operation for background
6. Update UI to reflect bookmark state

### Search Interaction Flow
1. User enters search query
2. Add SearchQuery to AppState.searchHistory
3. Search across cached ContentItems
4. If insufficient results: query API
5. Cache new results in ContentCache
6. Return ranked results to UI
7. Track result selection for relevance

### Offline Synchronization Flow
1. Detect network connectivity change
2. Compare local ContentCache.syncVersion with server
3. Upload pending BookmarkCollection changes
4. Download updated ContentItems
5. Resolve conflicts (server precedence)
6. Update cache expiration dates
7. Notify UI of sync completion

## Storage Implementation

### AsyncStorage Schema
```typescript
// User preferences
'user.preferences': JSON<UserPreferences>

// Bookmark collections
'bookmarks.collection': JSON<BookmarkCollection>

// Content cache by type and language
'cache.news.en': JSON<ContentCache>
'cache.news.he': JSON<ContentCache>
'cache.concepts.en': JSON<ContentCache>
'cache.concepts.he': JSON<ContentCache>
'cache.tools.en': JSON<ContentCache>
'cache.tools.he': JSON<ContentCache>

// Application state
'app.state': JSON<AppState>
'app.session': JSON<SessionInfo>
```

### Performance Considerations
- **Lazy Loading**: Load ContentItems on demand to reduce memory usage
- **Pagination**: Implement virtual scrolling for large content lists
- **Indexing**: Create search indices for fast text search
- **Compression**: Use gzip for large cached content
- **Cleanup**: Automatic cleanup of expired cache entries
- **Size Limits**: Enforce storage quotas to prevent device issues

### Migration Strategy
- **Version Tracking**: Schema version in each storage key
- **Backward Compatibility**: Support previous data formats during upgrades
- **Gradual Migration**: Migrate data incrementally to avoid blocking UI
- **Fallback Handling**: Graceful degradation for migration failures
- **User Communication**: Progress indicators for long migrations

This data model maintains constitutional compliance by preserving YAML source structure while enabling mobile-optimized access patterns and offline capabilities.