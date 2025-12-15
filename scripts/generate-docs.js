#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

const ROOT_DIR = path.join(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const SERVER_FILE = path.join(ROOT_DIR, 'server.js');
const DATA_DIR = path.join(ROOT_DIR, 'public', 'data');
const PACKAGE_JSON = path.join(ROOT_DIR, 'package.json');

// Ensure docs directory exists
async function ensureDocsDir() {
    try {
        await fs.mkdir(DOCS_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating docs directory:', error);
    }
}

// Parse server.js to extract API endpoints
async function parseServerFile() {
    const content = await fs.readFile(SERVER_FILE, 'utf8');
    const routes = [];
    
    // Simple regex patterns to extract Express routes
    const getPattern = /app\.get\(['"]([^'"]+)['"]/g;
    const postPattern = /app\.post\(['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = getPattern.exec(content)) !== null) {
        routes.push({ method: 'GET', path: match[1] });
    }
    
    while ((match = postPattern.exec(content)) !== null) {
        routes.push({ method: 'POST', path: match[1] });
    }
    
    return routes;
}

// Extract route details from server.js with context
async function extractRouteDetails() {
    const content = await fs.readFile(SERVER_FILE, 'utf8');
    const lines = content.split('\n');
    const endpoints = [];
    
    const routePattern = /app\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/;
    
    for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(routePattern);
        if (match) {
            const method = match[1].toUpperCase();
            const path = match[2];
            
            // Extract comments above the route
            let description = '';
            let j = i - 1;
            while (j >= 0 && (lines[j].trim().startsWith('//') || lines[j].trim() === '')) {
                if (lines[j].trim().startsWith('//')) {
                    description = lines[j].trim().substring(2).trim() + ' ' + description;
                }
                j--;
            }
            
            // Try to extract request body parameters
            let parameters = [];
            let k = i + 1;
            let braceCount = 0;
            let inRoute = false;
            
            while (k < Math.min(i + 50, lines.length)) {
                const line = lines[k];
                if (line.includes('{')) braceCount++;
                if (line.includes('}')) braceCount--;
                
                // Look for destructured req.body, req.query, req.params
                const bodyMatch = line.match(/const\s*\{\s*([^}]+)\s*\}\s*=\s*req\.(body|query|params)/);
                if (bodyMatch) {
                    const params = bodyMatch[1].split(',').map(p => p.trim());
                    parameters.push(...params.map(p => ({
                        name: p,
                        type: bodyMatch[2]
                    })));
                }
                
                if (braceCount === 0 && inRoute) break;
                if (braceCount > 0) inRoute = true;
                k++;
            }
            
            endpoints.push({
                method,
                path,
                description: description || 'No description available',
                parameters
            });
        }
    }
    
    return endpoints;
}

// Generate API documentation
async function generateAPIDocs() {
    const endpoints = await extractRouteDetails();
    
    let content = `# API Documentation

This document provides detailed information about all API endpoints available in the AI Knowledge Base.

## Base URL
\`\`\`
http://localhost:8085
\`\`\`

## Endpoints

`;

    for (const endpoint of endpoints) {
        content += `### ${endpoint.method} ${endpoint.path}\n\n`;
        content += `**Description:** ${endpoint.description}\n\n`;
        
        if (endpoint.parameters && endpoint.parameters.length > 0) {
            content += `**Parameters:**\n\n`;
            for (const param of endpoint.parameters) {
                content += `- \`${param.name}\` (${param.type})\n`;
            }
            content += '\n';
        }
        
        // Add examples based on the endpoint path
        if (endpoint.path.includes('/api/hot-news')) {
            if (endpoint.method === 'GET') {
                content += `**Example Request:**\n\`\`\`bash\ncurl http://localhost:8085${endpoint.path.replace(':lang', 'en')}\n\`\`\`\n\n`;
                content += `**Example Response:**\n\`\`\`json\n{\n  "hot_news": [\n    {\n      "section": "AI Updates",\n      "topics": [...]\n    }\n  ]\n}\n\`\`\`\n\n`;
            } else if (endpoint.method === 'POST') {
                content += `**Example Request:**\n\`\`\`bash\ncurl -X POST http://localhost:8085${endpoint.path.replace(':lang', 'en')} \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "sections": [\n      {\n        "section": "AI Updates",\n        "topics": [\n          {\n            "title": "New AI Development",\n            "description": "Description here",\n            "links": []\n          }\n        ]\n      }\n    ]\n  }'\n\`\`\`\n\n`;
            }
        } else if (endpoint.path === '/proxy-rss') {
            content += `**Example Request:**\n\`\`\`bash\ncurl "http://localhost:8085/proxy-rss?url=https://example.com/feed.xml"\n\`\`\`\n\n`;
        } else if (endpoint.path === '/generate-text') {
            content += `**Example Request:**\n\`\`\`bash\ncurl -X POST http://localhost:8085/generate-text \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "apiKey": "your-openai-api-key",\n    "prompt": "Explain quantum computing"\n  }'\n\`\`\`\n\n`;
        }
        
        content += '---\n\n';
    }
    
    content += `\n## CORS Configuration

The API uses CORS with the following allowed origins:
- http://localhost:8085
- https://leonmelamud.github.io

---

*This documentation was automatically generated from server.js*\n`;
    
    await fs.writeFile(path.join(DOCS_DIR, 'API.md'), content);
    console.log('✅ Generated API.md');
}

// Parse YAML files and generate schema documentation
async function generateDataSchemasDocs() {
    const yamlFiles = [
        'news_en.yaml',
        'news_he.yaml',
        'concepts_en.yaml',
        'concepts_he.yaml',
        'links_en.yaml',
        'links_he.yaml'
    ];
    
    const jsonFiles = [
        'ui_translations_en.json',
        'ui_translations_he.json'
    ];
    
    let content = `# Data Schemas Documentation

This document describes the structure of all data files used in the AI Knowledge Base.

## Overview

The AI Knowledge Base uses YAML and JSON files to store structured content in both English and Hebrew.

`;

    // Parse YAML files
    for (const file of yamlFiles) {
        const filePath = path.join(DATA_DIR, file);
        try {
            const fileContent = await fs.readFile(filePath, 'utf8');
            const data = yaml.load(fileContent);
            
            content += `## ${file}\n\n`;
            content += `**Location:** \`public/data/${file}\`\n\n`;
            
            if (file.startsWith('news_')) {
                content += `**Purpose:** Stores hot news topics and updates about AI\n\n`;
                content += `**Structure:**\n\`\`\`yaml\nhot_news:\n  - section: string          # Section name\n    topics:\n      - title: string        # Topic title\n        description: string  # Detailed description\n        images: array        # Optional array of image URLs\n        links: array         # Optional array of related links\n          - name: string\n            url: string\n        questions: array     # Optional Q&A items\n          - question: string\n            answer: string\n\`\`\`\n\n`;
                
                if (data.hot_news && data.hot_news.length > 0) {
                    content += `**Example:**\n\`\`\`yaml\n`;
                    content += `section: "${data.hot_news[0].section}"\n`;
                    content += `topics:\n`;
                    if (data.hot_news[0].topics && data.hot_news[0].topics[0]) {
                        content += `  - title: "${data.hot_news[0].topics[0].title}"\n`;
                        content += `    description: "${data.hot_news[0].topics[0].description ? data.hot_news[0].topics[0].description.substring(0, 100) + '...' : 'N/A'}"\n`;
                    }
                    content += `\`\`\`\n\n`;
                }
                
                content += `**Statistics:** ${data.hot_news ? data.hot_news.length : 0} sections\n\n`;
            } else if (file.startsWith('concepts_')) {
                content += `**Purpose:** Stores AI concepts with detailed explanations\n\n`;
                content += `**Structure:**\n\`\`\`yaml\nconcepts:\n  - id: string                    # Unique identifier\n    title: string                 # Category title\n    items:\n      - name: string              # Concept name\n        shortDescription: string  # Brief description\n        fullDescription: string   # Detailed markdown description\n        commonQuestions: array    # Optional Q&A items\n          - question: string\n            answer: string\n        relatedConcepts: array    # Optional related concept IDs\n\`\`\`\n\n`;
                
                if (data.concepts && data.concepts.length > 0) {
                    content += `**Example:**\n\`\`\`yaml\n`;
                    content += `id: "${data.concepts[0].id}"\n`;
                    content += `title: "${data.concepts[0].title}"\n`;
                    if (data.concepts[0].items && data.concepts[0].items[0]) {
                        content += `items:\n  - name: "${data.concepts[0].items[0].name}"\n`;
                    }
                    content += `\`\`\`\n\n`;
                }
                
                let totalItems = 0;
                if (data.concepts) {
                    data.concepts.forEach(cat => {
                        if (cat.items) totalItems += cat.items.length;
                    });
                }
                content += `**Statistics:** ${data.concepts ? data.concepts.length : 0} categories, ${totalItems} concepts\n\n`;
            } else if (file.startsWith('links_')) {
                content += `**Purpose:** Stores links to AI tools and resources\n\n`;
                content += `**Structure:**\n\`\`\`yaml\ntools:\n  - id: string          # Unique identifier\n    title: string       # Category title\n    items:\n      - name: string    # Tool name\n        company: string # Company/creator name\n        url: string     # Tool URL\n        description: string # Markdown description\n\`\`\`\n\n`;
                
                if (data.tools && data.tools.length > 0) {
                    content += `**Example:**\n\`\`\`yaml\n`;
                    content += `id: "${data.tools[0].id}"\n`;
                    content += `title: "${data.tools[0].title}"\n`;
                    if (data.tools[0].items && data.tools[0].items[0]) {
                        content += `items:\n  - name: "${data.tools[0].items[0].name}"\n`;
                        content += `    company: "${data.tools[0].items[0].company}"\n`;
                    }
                    content += `\`\`\`\n\n`;
                }
                
                let totalItems = 0;
                if (data.tools) {
                    data.tools.forEach(cat => {
                        if (cat.items) totalItems += cat.items.length;
                    });
                }
                content += `**Statistics:** ${data.tools ? data.tools.length : 0} categories, ${totalItems} tools\n\n`;
            }
            
            content += '---\n\n';
        } catch (error) {
            console.error(`Error parsing ${file}:`, error.message);
        }
    }
    
    // Parse JSON files
    for (const file of jsonFiles) {
        const filePath = path.join(DATA_DIR, file);
        try {
            const fileContent = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(fileContent);
            
            content += `## ${file}\n\n`;
            content += `**Location:** \`public/data/${file}\`\n\n`;
            content += `**Purpose:** UI text translations for the ${file.includes('_en') ? 'English' : 'Hebrew'} interface\n\n`;
            content += `**Structure:** Key-value pairs for UI text elements\n\n`;
            content += `**Sample Keys:**\n\`\`\`json\n{\n`;
            const keys = Object.keys(data).slice(0, 5);
            keys.forEach((key, idx) => {
                content += `  "${key}": "${data[key]}"${idx < keys.length - 1 ? ',' : ''}\n`;
            });
            content += `}\n\`\`\`\n\n`;
            content += `**Statistics:** ${Object.keys(data).length} translation keys\n\n`;
            content += '---\n\n';
        } catch (error) {
            console.error(`Error parsing ${file}:`, error.message);
        }
    }
    
    content += `\n## Multi-Language Support

The data structure mirrors across English (_en) and Hebrew (_he) files:
- **news_en.yaml** ↔ **news_he.yaml**
- **concepts_en.yaml** ↔ **concepts_he.yaml**
- **links_en.yaml** ↔ **links_he.yaml**
- **ui_translations_en.json** ↔ **ui_translations_he.json**

This ensures the site can serve content in both languages seamlessly.

---

*This documentation was automatically generated from data files*\n`;
    
    await fs.writeFile(path.join(DOCS_DIR, 'DATA_SCHEMAS.md'), content);
    console.log('✅ Generated DATA_SCHEMAS.md');
}

// Generate architecture documentation
async function generateArchitectureDocs() {
    const packageContent = await fs.readFile(PACKAGE_JSON, 'utf8');
    const packageJson = JSON.parse(packageContent);
    
    let content = `# Architecture Documentation

## System Overview

The AI Knowledge Base is a bilingual (English/Hebrew) web application built with:
- **Backend:** Express.js (Node.js)
- **Frontend:** Vanilla JavaScript
- **Data Storage:** YAML and JSON files
- **Deployment:** GitHub Pages

## Architecture Diagram

\`\`\`
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
\`\`\`

## Server Architecture

### Entry Point
- **File:** \`server.js\`
- **Port:** ${packageJson.name === 'ai-knowledge-base' ? '8085 (configurable via PORT env)' : '8085'}

### Core Dependencies
`;

    const deps = packageJson.dependencies || {};
    Object.entries(deps).forEach(([name, version]) => {
        let description = '';
        switch(name) {
            case 'express':
                description = 'Web application framework for Node.js';
                break;
            case 'cors':
                description = 'Enable Cross-Origin Resource Sharing';
                break;
            case 'js-yaml':
                description = 'YAML parser for reading data files';
                break;
            case 'js-tiktoken':
                description = 'Token counting for OpenAI models';
                break;
            case 'rss-parser':
                description = 'RSS feed parsing';
                break;
            case 'node-fetch':
                description = 'HTTP client for external API calls';
                break;
            default:
                description = 'Supporting library';
        }
        content += `- **${name}** (${version}) - ${description}\n`;
    });

    content += `\n## Frontend Structure

### Directory Layout
\`\`\`
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
\`\`\`

### Frontend Technologies
- **Vanilla JavaScript** - No framework dependencies
- **Modular Design** - Separate JS files for different features
- **Dynamic Content Loading** - Data loaded from YAML/JSON files
- **Responsive Design** - Mobile-friendly interface

## Data Flow

### 1. Page Load
\`\`\`
User visits site → HTML loads → JavaScript modules initialize
→ Fetch data files (YAML/JSON) → Render content in selected language
\`\`\`

### 2. Language Switching
\`\`\`
User clicks language toggle → translations.js updates UI text
→ Reload data from _en or _he files → Re-render content
\`\`\`

### 3. Hot News API
\`\`\`
POST /api/hot-news/:lang → Validate request → Read YAML file
→ Append new topics → Write updated YAML → Return success
\`\`\`

### 4. RSS Feed Proxy
\`\`\`
GET /proxy-rss?url=... → Fetch external RSS feed
→ Return XML to client → Client parses and displays
\`\`\`

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
- **Workflow:** \`.github/workflows/static.yml\`
- **Trigger:** Push to main branch or manual dispatch
- **Process:** 
  1. Checkout code
  2. Install dependencies
  3. Upload \`/public\` directory
  4. Deploy to GitHub Pages

### Development
\`\`\`bash
npm install    # Install dependencies
npm start      # Start local server on port 8085
\`\`\`

## API Integration Points

### OpenAI Integration
- **Endpoint:** \`/generate-text\`
- **Purpose:** Generate AI-powered text responses
- **Model:** GPT-4o-mini

### External RSS Feeds
- **Endpoint:** \`/proxy-rss\`
- **Purpose:** Bypass CORS restrictions for RSS feeds

## Performance Considerations

- **Static Assets:** Served directly by Express
- **File-Based Storage:** No database overhead
- **Minimal Dependencies:** Lightweight deployment
- **Client-Side Rendering:** Offload work to browser

## Development Dependencies
`;

    const devDeps = packageJson.devDependencies || {};
    Object.entries(devDeps).forEach(([name, version]) => {
        content += `- **${name}** (${version})\n`;
    });

    content += `\n---

*This documentation was automatically generated from package.json and source files*\n`;

    await fs.writeFile(path.join(DOCS_DIR, 'ARCHITECTURE.md'), content);
    console.log('✅ Generated ARCHITECTURE.md');
}

// Generate contributing documentation
async function generateContributingDocs() {
    const content = `# Contributing to AI Knowledge Base

Thank you for your interest in contributing to the AI Knowledge Base! This guide will help you understand how to add content and contribute to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Adding New Content](#adding-new-content)
- [File Structure](#file-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Style Guidelines](#style-guidelines)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)
- Git
- A text editor (VS Code recommended)

### Local Setup

1. **Clone the repository:**
   \`\`\`bash
   git clone git@github.com:LeonMelamud/AI-Knowledge.git
   cd AI-Knowledge
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Start the development server:**
   \`\`\`bash
   npm start
   \`\`\`

4. **Open your browser:**
   Navigate to \`http://localhost:8085\`

## Adding New Content

### Adding Hot News

Hot news items are stored in YAML files. The site supports both English and Hebrew.

**File locations:**
- English: \`public/data/news_en.yaml\`
- Hebrew: \`public/data/news_he.yaml\`

**Manual Method:**

Edit the YAML file directly:
\`\`\`yaml
hot_news:
  - section: "Your Section Name"
    topics:
      - title: "News Title"
        description: |
          Your detailed description here.
          Can be multiple lines.
        images:
          - "image-url.jpg"
        links:
          - name: "Source Link"
            url: "https://example.com"
        questions:
          - question: "Common question?"
            answer: "Detailed answer here."
\`\`\`

**API Method:**

Use the Hot News API to add content programmatically:
\`\`\`bash
curl -X POST http://localhost:8085/api/hot-news/en \\
  -H "Content-Type: application/json" \\
  -d '{
    "sections": [
      {
        "section": "AI Updates",
        "topics": [
          {
            "title": "New Development",
            "description": "Description here",
            "links": [{"name": "Source", "url": "https://example.com"}]
          }
        ]
      }
    ]
  }'
\`\`\`

### Adding AI Concepts

Concepts are detailed explanations of AI terms and technologies.

**File locations:**
- English: \`public/data/concepts_en.yaml\`
- Hebrew: \`public/data/concepts_he.yaml\`

**Format:**
\`\`\`yaml
concepts:
  - id: "unique-id"
    title: "Category Title"
    items:
      - name: "Concept Name"
        shortDescription: "Brief one-line description"
        fullDescription: |
          # Detailed Markdown Content
          
          Full explanation with formatting, lists, code blocks, etc.
        commonQuestions:
          - question: "What is this?"
            answer: "Detailed answer"
        relatedConcepts:
          - "related-concept-id"
\`\`\`

### Adding AI Tools & Resources

Tools and resource links are categorized collections.

**File locations:**
- English: \`public/data/links_en.yaml\`
- Hebrew: \`public/data/links_he.yaml\`

**Format:**
\`\`\`yaml
tools:
  - id: "category-id"
    title: "Category Title"
    items:
      - name: "Tool Name"
        company: "Company/Creator"
        url: "https://tool-url.com"
        description: |
          Detailed description in Markdown format.
          Can include features, use cases, etc.
\`\`\`

### Adding UI Translations

UI text translations ensure the interface works in multiple languages.

**File locations:**
- English: \`public/data/ui_translations_en.json\`
- Hebrew: \`public/data/ui_translations_he.json\`

**Format:**
\`\`\`json
{
  "key_name": "Translated text",
  "another_key": "More text"
}
\`\`\`

**Important:** Both language files must have matching keys.

## File Structure

\`\`\`
AI-Knowledge/
├── .github/
│   └── workflows/           # GitHub Actions workflows
├── public/                  # Static files (served by Express)
│   ├── data/               # YAML/JSON data files
│   ├── js/                 # Frontend JavaScript
│   ├── css/                # Stylesheets
│   └── index.html          # Main HTML file
├── server/                  # Server-side code
│   └── test/               # Test files
├── src/                     # Additional source files
├── docs/                    # Documentation (auto-generated)
├── scripts/                 # Build and utility scripts
├── server.js               # Express server entry point
└── package.json            # Dependencies and scripts
\`\`\`

## Development Workflow

### 1. Create a Branch

\`\`\`bash
git checkout -b feature/your-feature-name
\`\`\`

### 2. Make Changes

Edit the appropriate YAML/JSON files or code files.

### 3. Test Locally

\`\`\`bash
npm start
# Visit http://localhost:8085 to verify changes
\`\`\`

### 4. Validate Data Format

Ensure YAML files are valid:
\`\`\`bash
npm run docs:validate
\`\`\`

### 5. Commit Changes

\`\`\`bash
git add .
git commit -m "feat: Add new AI concept for transformers"
\`\`\`

### 6. Push and Create PR

\`\`\`bash
git push origin feature/your-feature-name
\`\`\`

Then create a Pull Request on GitHub.

## Testing

### Run Tests

\`\`\`bash
npm test
\`\`\`

### Test Hot News API

\`\`\`bash
npm run test:hot-news
\`\`\`

### Manual Testing Checklist

- [ ] Server starts without errors
- [ ] All pages load correctly
- [ ] Language switching works
- [ ] New content appears properly formatted
- [ ] Links open correctly
- [ ] Images display (if added)
- [ ] No console errors in browser

## Style Guidelines

### YAML Files

- Use 2 spaces for indentation (no tabs)
- Keep descriptions concise but informative
- Use pipe (\`|\`) for multi-line strings
- Ensure consistent structure across language versions

### Code

- Follow existing code style
- Add comments for complex logic
- Keep functions small and focused
- Handle errors gracefully

### Content

- Use clear, professional language
- Provide accurate information with sources
- Include examples where helpful
- Keep descriptions concise but complete

### Commit Messages

Follow conventional commits:
- \`feat:\` New feature
- \`fix:\` Bug fix
- \`docs:\` Documentation changes
- \`style:\` Formatting changes
- \`refactor:\` Code restructuring
- \`test:\` Adding tests
- \`chore:\` Maintenance tasks

## Documentation

After making changes:

1. Documentation is auto-generated by GitHub Actions
2. The workflow runs on every push to main
3. Check \`docs/\` directory for updated documentation

To manually generate documentation:
\`\`\`bash
npm run docs:generate
\`\`\`

## Getting Help

- **Issues:** Open an issue on GitHub
- **Questions:** Use GitHub Discussions
- **Security:** Report via GitHub Security Advisories

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on improving the project
- Help others learn and grow

---

Thank you for contributing to the AI Knowledge Base! 🚀

*This documentation is maintained as part of the auto-documentation system*
`;

    await fs.writeFile(path.join(DOCS_DIR, 'CONTRIBUTING.md'), content);
    console.log('✅ Generated CONTRIBUTING.md');
}

// Generate README for docs directory
async function generateDocsReadme() {
    const content = `# Documentation Hub

Welcome to the AI Knowledge Base documentation! This directory contains comprehensive, auto-generated documentation for the entire project.

## 📚 Documentation Files

### [API.md](./API.md)
Complete API reference with all endpoints, parameters, and examples.
- REST API endpoints
- Request/response formats
- Example curl commands
- CORS configuration

### [DATA_SCHEMAS.md](./DATA_SCHEMAS.md)
Detailed schemas for all data files used in the project.
- YAML file structures
- JSON file formats
- Field descriptions
- Example data

### [ARCHITECTURE.md](./ARCHITECTURE.md)
System architecture and technical overview.
- Architecture diagrams
- Technology stack
- Data flow
- Deployment process

### [CONTRIBUTING.md](./CONTRIBUTING.md)
Guide for contributors.
- Setup instructions
- How to add content
- Development workflow
- Testing procedures

## 🔄 Auto-Generated Documentation

This documentation is **automatically generated** from the source code and data files:

- **Trigger:** Every push to main, pull requests, and daily schedule
- **Generator:** \`scripts/generate-docs.js\`
- **Workflow:** \`.github/workflows/auto-docs.yml\`

### What Gets Auto-Generated?

1. **API Documentation** - Extracted from \`server.js\`
2. **Data Schemas** - Parsed from YAML/JSON files in \`public/data/\`
3. **Architecture** - Built from \`package.json\` and source structure
4. **Contributing Guide** - Standard guidelines with project-specific details

## 📊 Project Statistics

The documentation system automatically tracks:
- Number of API endpoints
- Data file schemas
- Dependencies and versions
- System architecture details

## 🛠️ Regenerating Documentation

To manually regenerate documentation:

\`\`\`bash
npm run docs:generate
\`\`\`

To validate documentation:

\`\`\`bash
npm run docs:validate
\`\`\`

## 🔍 Finding Information

- **API Endpoints** → See [API.md](./API.md)
- **Data Structure** → See [DATA_SCHEMAS.md](./DATA_SCHEMAS.md)
- **System Design** → See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Contributing** → See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 🤖 Powered By

This auto-documentation system uses:
- **Node.js scripts** for parsing and generation
- **GitHub Actions** for automation
- **Acorn & Espree** for JavaScript AST parsing
- **js-yaml** for YAML parsing

---

*This documentation hub is automatically maintained and updated with every code change.*
`;

    await fs.writeFile(path.join(DOCS_DIR, 'README.md'), content);
    console.log('✅ Generated docs/README.md');
}

// Main function
async function main() {
    console.log('🚀 Generating documentation...\n');
    
    await ensureDocsDir();
    await generateAPIDocs();
    await generateDataSchemasDocs();
    await generateArchitectureDocs();
    await generateContributingDocs();
    await generateDocsReadme();
    
    console.log('\n✨ Documentation generation complete!');
    console.log('📁 Generated files in docs/ directory');
}

main().catch(error => {
    console.error('❌ Error generating documentation:', error);
    process.exit(1);
});
