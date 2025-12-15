# Contributing to AI Knowledge Base

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
   ```bash
   git clone git@github.com:LeonMelamud/AI-Knowledge.git
   cd AI-Knowledge
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:8085`

## Adding New Content

### Adding Hot News

Hot news items are stored in YAML files. The site supports both English and Hebrew.

**File locations:**
- English: `public/data/news_en.yaml`
- Hebrew: `public/data/news_he.yaml`

**Manual Method:**

Edit the YAML file directly:
```yaml
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
```

**API Method:**

Use the Hot News API to add content programmatically:
```bash
curl -X POST http://localhost:8085/api/hot-news/en \
  -H "Content-Type: application/json" \
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
```

### Adding AI Concepts

Concepts are detailed explanations of AI terms and technologies.

**File locations:**
- English: `public/data/concepts_en.yaml`
- Hebrew: `public/data/concepts_he.yaml`

**Format:**
```yaml
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
```

### Adding AI Tools & Resources

Tools and resource links are categorized collections.

**File locations:**
- English: `public/data/links_en.yaml`
- Hebrew: `public/data/links_he.yaml`

**Format:**
```yaml
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
```

### Adding UI Translations

UI text translations ensure the interface works in multiple languages.

**File locations:**
- English: `public/data/ui_translations_en.json`
- Hebrew: `public/data/ui_translations_he.json`

**Format:**
```json
{
  "key_name": "Translated text",
  "another_key": "More text"
}
```

**Important:** Both language files must have matching keys.

## File Structure

```
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
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Edit the appropriate YAML/JSON files or code files.

### 3. Test Locally

```bash
npm start
# Visit http://localhost:8085 to verify changes
```

### 4. Validate Data Format

Ensure YAML files are valid:
```bash
npm run docs:validate
```

### 5. Commit Changes

```bash
git add .
git commit -m "feat: Add new AI concept for transformers"
```

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Testing

### Run Tests

```bash
npm test
```

### Test Hot News API

```bash
npm run test:hot-news
```

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
- Use pipe (`|`) for multi-line strings
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
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Formatting changes
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance tasks

## Documentation

After making changes:

1. Documentation is auto-generated by GitHub Actions
2. The workflow runs on every push to main
3. Check `docs/` directory for updated documentation

To manually generate documentation:
```bash
npm run docs:generate
```

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
