# AI Knowledge Base

## About This Site

The AI Knowledge Base is a comprehensive resource for artificial intelligence enthusiasts, students, and professionals. Our purpose is to provide up-to-date information, explanations, and resources on various AI topics, tools, and concepts.

Key features of this site include:

- Hot News: Stay informed about the latest developments in AI, including breakthroughs in language models, computer vision, and more.
- AI Concepts: Detailed explanations of fundamental and advanced AI concepts, from machine learning basics to cutting-edge techniques.
- Tools and Resources: Curated links to popular AI tools, libraries, and platforms, along with brief descriptions of their capabilities.
- Interactive Elements: Engage with features like token calculators and potentially AI-powered chat interfaces (if implemented).

This site serves as a centralized hub for AI knowledge, helping users navigate the rapidly evolving field of artificial intelligence. Whether you're looking to understand basic concepts, explore advanced techniques, or stay updated on the latest AI news, our AI Knowledge Base has you covered.

We continuously update our content to reflect the latest advancements in AI, ensuring that our users have access to the most current and relevant information in the field.

## Running Locally

1. Clone the repository:
   ```
   git clone git@github.com:LeonMelamud/AI-Knowledge.git
   ```

2. Navigate to the project directory:
   ```
   cd your-repo-name
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Start the development server:
   ```
   npm run start
   ```

5. Open your browser and visit `http://localhost:8085`

## 📚 Auto-Documentation System

This repository features a **fully autonomous documentation system** that automatically generates and maintains comprehensive documentation with zero manual intervention.

### Features

- **🤖 Automatic Generation**: Documentation is auto-generated from source code and data files
- **🔄 Always in Sync**: Updates automatically on every code change
- **✅ Self-Validating**: Built-in validation ensures documentation accuracy
- **🔀 Auto-Merge**: Documentation-only changes merge automatically after passing all checks

### Documentation Available

Visit the [`docs/`](./docs/) directory for:
- **[API Reference](./docs/API.md)** - Complete API endpoint documentation
- **[Data Schemas](./docs/DATA_SCHEMAS.md)** - YAML/JSON data structure documentation
- **[Architecture](./docs/ARCHITECTURE.md)** - System architecture and tech stack
- **[Contributing Guide](./docs/CONTRIBUTING.md)** - How to contribute to the project

### Manual Documentation Commands

```bash
# Generate documentation
npm run docs:generate

# Validate documentation
npm run docs:validate
```

The auto-documentation workflow runs automatically on:
- Every push to `main` branch
- Every pull request
- Daily at midnight UTC (sync check)
- Manual workflow dispatch


## Adding New Data

To add new data to the site, update the files in the `public/data` directory:
this is multi language site , English and Hebrew. 
### File Structure

- `public/data/`
  - `news_en.yaml`: Contains hot news topics in English
  - `ui_translations_en.json`: UI text translations in English
  - `links_en.yaml`: Links to various AI tools and resources
  - `concepts_en.yaml`: Detailed information about AI concepts


1. `news_en.yaml`:
   - Contains hot news topics organized by sections
   - Each topic includes a title, description, and optional images and links

2. `ui_translations_en.json`:
   - Stores UI text translations for various components
   - Includes button labels, messages, and section titles

3. `links_en.yaml`:
   - Organizes links to AI tools and resources by categories
   - Each item includes name, company, URL, and description

4. `concepts_en.yaml`:
   - Provides detailed information about AI concepts
   - Organized into categories like AI basics, advanced concepts, and techniques
   - Each concept includes a name, short description, and full description

5. `.github/workflows/static.yml`:
   - GitHub Actions workflow for deploying the site to GitHub Pages
   - Installs dependencies and uploads the `public` directory as an artifact

After updating these files, the site will automatically rebuild and redeploy when changes are pushed to the main branch.
