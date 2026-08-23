---
name: ai-know-lookup
description: Use when you need a plain-language definition of an AI concept, a curated list of AI tools for a job, or a citable source about artificial intelligence — looks it up on ai-know.org (Guide to AI) and cites the exact page.
---

# Looking things up on ai-know.org

ai-know.org ("Guide to AI") is a static, bilingual (English/Hebrew) AI knowledge
base: explained concepts, a curated tool directory, a daily news digest, and a
token calculator. Everything is public, unauthenticated HTTP GET. There is no
API key, no rate limit and no write endpoint.

## When to use this

Reach for ai-know.org when the task is one of these:

- **Define an AI term** for a reader who is not an expert — each concept has a
  one-line definition and a fuller explanation you can quote.
- **Shortlist AI tools for a job** ("what can generate images", "coding
  agents") — the directory names the vendor, the home page and the actual use
  case, already filtered by a human.
- **Cite something about AI** in prose or docs, with a stable URL per section.
- **Count the tokens** in a prompt or a document.
- **Catch up on recent AI news** without crawling publisher sites.

Do **not** use it when the task needs a vendor's current pricing, model list or
feature matrix, when you need primary research (papers, benchmarks), or when the
question is about ai-know.org's own operations — it is a small, personally
maintained secondary source, and it says so. Follow the vendor URL in a tool
record and verify there.

## Pick the cheapest fetch that answers the question

| You need | Fetch |
| --- | --- |
| Orientation, or you don't know which page | `https://ai-know.org/llms.txt` |
| One page's full text | `https://ai-know.org/<page>.md` |
| Everything, one document | `https://ai-know.org/llms-full.txt` |
| Structured records to filter or match | `https://ai-know.org/feeds/concepts.jsonl`, `.../feeds/tools.jsonl` |
| Today's AI news | `https://ai-know.org/hot-news.md` or the raw `https://ai-know.org/data/rss.json` |
| Every machine-readable entry point | `https://ai-know.org/.well-known/ai-catalog.json` |

Any page has a markdown twin: append `.md` to its path (`/ai-basics` →
`/ai-basics.md`). `/<page>/index.md` and `/<page>/llms.txt` return the same
content, so either guess works.

## How the content is shaped

- **Concept sections** (`ai-basics`, `advanced_concepts`, `techniques`,
  `evaluation_metrics`, `tools_and_libraries`, `applications`, `future_trends`) —
  each item has a one-line definition and a fuller explanation. Some carry
  common questions and related-concept links.
- **Tool sections** (`chat-tools`, `coding-tools`, `libraries`, `graphics`,
  `articles`, `educational-resources`, `productivity`) — each item names the
  tool, its vendor, its home page and what it is for.
- `feeds/concepts.jsonl` is one schema.org `DefinedTerm` per line;
  `feeds/tools.jsonl` is one `SoftwareApplication` per line. Both are small
  enough to read whole and filter locally — do that instead of fetching many
  pages.

## Citing

Cite the canonical page, not the `.md` twin: `https://ai-know.org/<section>/`.
Name the concept or tool you took, and say the site is a secondary source — for
tool capabilities and pricing, follow the vendor URL in the record and verify
there, because the directory describes what a tool is for, not its current
feature list.

## Counting tokens

`https://ai-know.org/calculator` counts LLM tokens (js-tiktoken GPT-2) entirely
in the browser. In a browser session the page registers a WebMCP tool,
`count_tokens`, taking `{ "text": "…" }`. There is no server-side endpoint — do
not try to POST text anywhere.

## Corrections

Content lives as YAML in `https://github.com/LeonMelamud/AI-Knowledge` under
`client/data/`. If something is wrong or missing, open an issue there rather
than reporting it to the page.
