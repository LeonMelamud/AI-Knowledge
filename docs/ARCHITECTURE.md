# Architecture Documentation

## System Overview

The AI Knowledge Base is a bilingual (English/Hebrew) web application built with:
- **Backend:** Express.js (Node.js)
- **Frontend:** Vanilla JavaScript
- **Data Storage:** YAML and JSON files
- **Deployment:** GitHub Pages

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Client Browser                      │
│                  (Vanilla JavaScript)                    │
└───────────────────────┬─────────────────────────────────┘
                        │
                        │ HTTP Requests
                        │
┌───────────────────────▼─────────────────────────────────┐
│                   Express.js Server                      │
│                    (Node.js / Port 8085)                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  API Endpoints                                    │  │
│  │  - /proxy-rss (RSS feed proxy)                   │  │
│  │  - /generate-text (OpenAI integration)           │  │
│  │  - /api/hot-news/:lang (News CRUD)               │  │
│  │  - /api/artifacts (Artifact management)          │  │
│  │  - /assert-test (Token counting)                 │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Middleware                                       │  │
│  │  - CORS (allowedOrigins)                         │  │
│  │  - express.static (serves /public)               │  │
│  │  - express.json (JSON body parser)               │  │
│  └──────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────┘
                        │
                        │ File I/O
                        │
┌───────────────────────▼─────────────────────────────────┐
│              Data Storage (YAML/JSON Files)              │
│                                                           │
│  /public/data/                                            │
│  ├── news_en.yaml, news_he.yaml                          │
│  ├── concepts_en.yaml, concepts_he.yaml                  │
│  ├── links_en.yaml, links_he.yaml                        │
│  └── ui_translations_en.json, ui_translations_he.json    │
└───────────────────────────────────────────────────────────┘
```

## Server Architecture

### Entry Point
- **File:** `server.js`
- **Port:** 8085 (configurable via PORT env)

### Core Dependencies
- **cors** (^2.8.5) - Enable Cross-Origin Resource Sharing
- **express** (^4.19.2) - Web application framework for Node.js
- **js-tiktoken** (^1.0.21) - Token counting for OpenAI models
- **js-yaml** (^4.1.1) - YAML parser for reading data files
- **node-fetch** (^2.6.1) - HTTP client for external API calls
- **rss-parser** (^3.13.0) - RSS feed parsing

## Frontend Structure

### Directory Layout
```
/public/
├── index.html              # Main HTML entry point
├── css/                    # Stylesheets
├── js/                     # JavaScript modules
│   ├── main.js            # Main application logic
│   ├── translations.js    # Multi-language support
│   ├── hot-news.js        # Hot news display
│   ├── llm-apis.js        # LLM API integrations
│   ├── rss.js             # RSS feed handling
│   ├── calculator.js      # Token calculator
│   ├── lightbox.js        # Image lightbox
│   ├── aeo-schema.js      # Schema.org implementation
│   └── config.js          # Configuration
└── data/                   # YAML/JSON data files
```

### Frontend Technologies
- **Vanilla JavaScript** - No framework dependencies
- **Modular Design** - Separate JS files for different features
- **Dynamic Content Loading** - Data loaded from YAML/JSON files
- **Responsive Design** - Mobile-friendly interface

## Data Flow

### 1. Page Load
```
User visits site → HTML loads → JavaScript modules initialize
→ Fetch data files (YAML/JSON) → Render content in selected language
```

### 2. Language Switching
```
User clicks language toggle → translations.js updates UI text
→ Reload data from _en or _he files → Re-render content
```

### 3. Hot News API
```
POST /api/hot-news/:lang → Validate request → Read YAML file
→ Append new topics → Write updated YAML → Return success
```

### 4. RSS Feed Proxy
```
GET /proxy-rss?url=... → Fetch external RSS feed
→ Return XML to client → Client parses and displays
```

## Multi-Language Support

The application supports English and Hebrew through:

1. **Parallel Data Files:** Each content type has _en and _he versions
2. **UI Translations:** ui_translations_*.json files for interface text
3. **Dynamic Loading:** Language parameter determines which files to load
4. **Consistent Structure:** Identical schema across language versions

## Security Features

- **CORS Protection:** Whitelist of allowed origins
- **Input Validation:** API endpoints validate request bodies
- **Error Handling:** Try-catch blocks prevent crashes
- **Safe File Operations:** Path validation for file access

## Deployment

### GitHub Pages
- **Workflow:** `.github/workflows/static.yml`
- **Trigger:** Push to main branch or manual dispatch
- **Process:** 
  1. Checkout code
  2. Install dependencies
  3. Upload `/public` directory
  4. Deploy to GitHub Pages

### Development
```bash
npm install    # Install dependencies
npm start      # Start local server on port 8085
```

## API Integration Points

### OpenAI Integration
- **Endpoint:** `/generate-text`
- **Purpose:** Generate AI-powered text responses
- **Model:** GPT-4o-mini

### External RSS Feeds
- **Endpoint:** `/proxy-rss`
- **Purpose:** Bypass CORS restrictions for RSS feeds

## Performance Considerations

- **Static Assets:** Served directly by Express
- **File-Based Storage:** No database overhead
- **Minimal Dependencies:** Lightweight deployment
- **Client-Side Rendering:** Offload work to browser

## Development Dependencies
- **@babel/core** (^7.12.10)
- **@babel/preset-env** (^7.12.11)
- **@octokit/rest** (^22.0.1)
- **acorn** (^8.15.0)
- **babel-loader** (^8.2.2)
- **copy-webpack-plugin** (^9.1.0)
- **css-minimizer-webpack-plugin** (^3.0.0)
- **cssnano** (^5.0.0)
- **espree** (^11.0.0)
- **file-loader** (^6.0.0)
- **html-webpack-plugin** (^5.6.0)
- **image-minimizer-webpack-plugin** (^3.0.0)
- **mocha** (^9.1.3)
- **ts-loader** (^9.5.1)
- **typescript** (^5.6.2)
- **webpack** (^5.94.0)
- **webpack-cli** (^4.10.0)
- **webpack-dev-server** (^5.1.0)
- **webpack-node-externals** (^2.5.2)

---

*This documentation was automatically generated from package.json and source files*
