# Documentation Hub

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
- **Generator:** `scripts/generate-docs.js`
- **Workflow:** `.github/workflows/auto-docs.yml`

### What Gets Auto-Generated?

1. **API Documentation** - Extracted from `server.js`
2. **Data Schemas** - Parsed from YAML/JSON files in `public/data/`
3. **Architecture** - Built from `package.json` and source structure
4. **Contributing Guide** - Standard guidelines with project-specific details

## 📊 Project Statistics

The documentation system automatically tracks:
- Number of API endpoints
- Data file schemas
- Dependencies and versions
- System architecture details

## 🛠️ Regenerating Documentation

To manually regenerate documentation:

```bash
npm run docs:generate
```

To validate documentation:

```bash
npm run docs:validate
```

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
