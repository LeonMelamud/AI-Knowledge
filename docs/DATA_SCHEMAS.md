# Data Schemas Documentation

This document describes the structure of all data files used in the AI Knowledge Base.

## Overview

The AI Knowledge Base uses YAML and JSON files to store structured content in both English and Hebrew.

## news_en.yaml

**Location:** `public/data/news_en.yaml`

**Purpose:** Stores hot news topics and updates about AI

**Structure:**
```yaml
hot_news:
  - section: string          # Section name
    topics:
      - title: string        # Topic title
        description: string  # Detailed description
        images: array        # Optional array of image URLs
        links: array         # Optional array of related links
          - name: string
            url: string
        questions: array     # Optional Q&A items
          - question: string
            answer: string
```

**Example:**
```yaml
section: "MCP Ecosystem"
topics:
  - title: "Google Announces Official Support for MCP"
    description: "Google has announced official support for the Model Control Protocol (MCP), marking a significant st..."
```

**Statistics:** 67 sections

---

## news_he.yaml

**Location:** `public/data/news_he.yaml`

**Purpose:** Stores hot news topics and updates about AI

**Structure:**
```yaml
hot_news:
  - section: string          # Section name
    topics:
      - title: string        # Topic title
        description: string  # Detailed description
        images: array        # Optional array of image URLs
        links: array         # Optional array of related links
          - name: string
            url: string
        questions: array     # Optional Q&A items
          - question: string
            answer: string
```

**Example:**
```yaml
section: "אקוסיסטם MCP"
topics:
  - title: "גוגל מכריזה על תמיכה רשמית ב-MCP"
    description: "גוגל הכריזה על תמיכה רשמית בפרוטוקול בקרת מודל (MCP), מה שמסמן צעד משמעותי בסטנדרטיזציה של מסגרות תק..."
```

**Statistics:** 54 sections

---

## concepts_en.yaml

**Location:** `public/data/concepts_en.yaml`

**Purpose:** Stores AI concepts with detailed explanations

**Structure:**
```yaml
concepts:
  - id: string                    # Unique identifier
    title: string                 # Category title
    items:
      - name: string              # Concept name
        shortDescription: string  # Brief description
        fullDescription: string   # Detailed markdown description
        commonQuestions: array    # Optional Q&A items
          - question: string
            answer: string
        relatedConcepts: array    # Optional related concept IDs
```

**Example:**
```yaml
id: "ai-basics"
title: "Fundamentals of Artificial Intelligence"
items:
  - name: "Artificial Intelligence (AI)"
```

**Statistics:** 7 categories, 35 concepts

---

## concepts_he.yaml

**Location:** `public/data/concepts_he.yaml`

**Purpose:** Stores AI concepts with detailed explanations

**Structure:**
```yaml
concepts:
  - id: string                    # Unique identifier
    title: string                 # Category title
    items:
      - name: string              # Concept name
        shortDescription: string  # Brief description
        fullDescription: string   # Detailed markdown description
        commonQuestions: array    # Optional Q&A items
          - question: string
            answer: string
        relatedConcepts: array    # Optional related concept IDs
```

**Example:**
```yaml
id: "ai-basics"
title: "יסודות הבינה המלאכותית"
items:
  - name: "בינה מלאכותית (AI)"
```

**Statistics:** 6 categories, 25 concepts

---

## links_en.yaml

**Location:** `public/data/links_en.yaml`

**Purpose:** Stores links to AI tools and resources

**Structure:**
```yaml
tools:
  - id: string          # Unique identifier
    title: string       # Category title
    items:
      - name: string    # Tool name
        company: string # Company/creator name
        url: string     # Tool URL
        description: string # Markdown description
```

**Example:**
```yaml
id: "chat-tools"
title: "Language Tools"
items:
  - name: "ChatGPT"
    company: "OpenAI"
```

**Statistics:** 6 categories, 56 tools

---

## links_he.yaml

**Location:** `public/data/links_he.yaml`

**Purpose:** Stores links to AI tools and resources

**Structure:**
```yaml
tools:
  - id: string          # Unique identifier
    title: string       # Category title
    items:
      - name: string    # Tool name
        company: string # Company/creator name
        url: string     # Tool URL
        description: string # Markdown description
```

**Example:**
```yaml
id: "chat-tools"
title: "כלים לשפה"
items:
  - name: "ChatGPT"
    company: "OpenAI"
```

**Statistics:** 6 categories, 56 tools

---

## ui_translations_en.json

**Location:** `public/data/ui_translations_en.json`

**Purpose:** UI text translations for the English interface

**Structure:** Key-value pairs for UI text elements

**Sample Keys:**
```json
{
  "moreInfo": "More Info",
  "hideInfo": "Hide Info",
  "showMoreInfo": "Show More and Image",
  "generatePromptsAndVoice": "Generate Prompts and Voice",
  "noMatchingContent": "No matching content found."
}
```

**Statistics:** 60 translation keys

---

## ui_translations_he.json

**Location:** `public/data/ui_translations_he.json`

**Purpose:** UI text translations for the Hebrew interface

**Structure:** Key-value pairs for UI text elements

**Sample Keys:**
```json
{
  "moreInfo": "מידע מורחב",
  "hideInfo": "הסתר מידע מורחב",
  "showMoreInfo": "הצג מידע מפורט ותמונה",
  "generatePromptsAndVoice": "יצירת פרומפטים לבינה מלאכותית וקול",
  "noMatchingContent": "לא נמצא תוכן מתאים. נסה לשנות את מונחי החיפוש."
}
```

**Statistics:** 63 translation keys

---


## Multi-Language Support

The data structure mirrors across English (_en) and Hebrew (_he) files:
- **news_en.yaml** ↔ **news_he.yaml**
- **concepts_en.yaml** ↔ **concepts_he.yaml**
- **links_en.yaml** ↔ **links_he.yaml**
- **ui_translations_en.json** ↔ **ui_translations_he.json**

This ensures the site can serve content in both languages seamlessly.

---

*This documentation was automatically generated from data files*
