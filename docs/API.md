# API Documentation

This document provides detailed information about all API endpoints available in the AI Knowledge Base.

## Base URL
```
http://localhost:8085
```

## Endpoints

### GET /proxy-rss

**Description:** No description available

**Example Request:**
```bash
curl "http://localhost:8085/proxy-rss?url=https://example.com/feed.xml"
```

---

### GET /assert-test

**Description:** No description available

---

### POST /generate-text

**Description:** No description available

**Parameters:**

- `apiKey` (body)
- `prompt` (body)

**Example Request:**
```bash
curl -X POST http://localhost:8085/generate-text \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your-openai-api-key",
    "prompt": "Explain quantum computing"
  }'
```

---

### POST /api/hot-news/:lang

**Description:** API endpoint to add new content to the news YAML 

**Example Request:**
```bash
curl -X POST http://localhost:8085/api/hot-news/en \
  -H "Content-Type: application/json" \
  -d '{
    "sections": [
      {
        "section": "AI Updates",
        "topics": [
          {
            "title": "New AI Development",
            "description": "Description here",
            "links": []
          }
        ]
      }
    ]
  }'
```

---

### POST /api/artifacts

**Description:** Endpoint to create a new artifact 

---


## CORS Configuration

The API uses CORS with the following allowed origins:
- http://localhost:8085
- https://leonmelamud.github.io

---

*This documentation was automatically generated from server.js*
