// WebMCP: expose what this site can do as callable tools, so an agent driving a
// real browser session can count tokens or search the knowledge base instead of
// scraping the DOM and clicking. No-ops in browsers without an agent host, so
// this costs nothing at runtime beyond a feature check.
//
// Spec is still moving: some hosts expose navigator.modelContext.registerTool(),
// others a single provideContext({ tools }), and some attach it to document.
// All four shapes are tried and none is required.
import { getConcepts, getTools } from './data'
import { loadEncoder } from './tokens'

const SITE = 'https://ai-know.org'

// Tool output is context an agent pays for: full descriptions run to thousands
// of characters, and the page URL is there for anything longer.
const brief = (value: string | undefined, max = 400) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim()
  return text.length > max ? `${text.slice(0, text.lastIndexOf(' ', max))}…` : text
}

type ToolResult = { content: Array<{ type: 'text'; text: string }> }

type ToolDescriptor = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  execute: (args: Record<string, unknown>) => Promise<ToolResult>
}

type ModelContextHost = {
  registerTool?: (tool: ToolDescriptor) => unknown
  provideContext?: (context: { tools: ToolDescriptor[] }) => unknown
}

const reply = (value: unknown): ToolResult => ({
  content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }],
})

const TOOLS: ToolDescriptor[] = [
  {
    name: 'count_tokens',
    description:
      'Count the number of LLM tokens (js-tiktoken GPT-2 encoding) in a piece of text. Runs entirely in this browser tab — the text is never uploaded, logged or stored.',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string', description: 'The text whose tokens should be counted.' } },
      required: ['text'],
    },
    async execute({ text }) {
      const value = String(text ?? '')
      const encode = await loadEncoder()
      return reply({ tokens: encode(value), characters: value.length, encoding: 'gpt2' })
    },
  },
  {
    name: 'search_ai_knowledge',
    description:
      'Search the ai-know.org knowledge base for an AI concept or tool by keyword. Returns matching concepts (with their definitions) and tools (with vendor and home page), each with the page to cite.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Keyword or phrase, for example "retrieval augmented generation" or "image generation".' },
        limit: { type: 'integer', description: 'Maximum results to return (default 10, maximum 50).' },
      },
      required: ['query'],
    },
    async execute({ query, limit }) {
      const q = String(query ?? '').toLowerCase().trim()
      if (!q) return reply('Provide a query, for example { "query": "transfer learning" }.')
      const max = Math.min(Math.max(Number(limit) || 10, 1), 50)
      const results: Array<Record<string, unknown>> = []
      for (const section of getConcepts('en')) {
        for (const item of section.items) {
          const hay = `${item.name} ${item.shortDescription ?? ''} ${item.fullDescription ?? ''}`.toLowerCase()
          if (!hay.includes(q)) continue
          results.push({
            kind: 'concept',
            name: item.name,
            section: section.title,
            definition: brief(item.shortDescription),
            page: `${SITE}/${section.id}/`,
            markdown: `${SITE}/${section.id}.md`,
            exactName: item.name.toLowerCase().includes(q),
          })
        }
      }
      for (const section of getTools('en')) {
        for (const item of section.items) {
          const hay = `${item.name} ${item.company ?? ''} ${item.description ?? ''}`.toLowerCase()
          if (!hay.includes(q)) continue
          results.push({
            kind: 'tool',
            name: item.name,
            vendor: item.company,
            description: brief(item.description),
            website: item.url,
            section: section.title,
            page: `${SITE}/${section.id}/`,
            exactName: item.name.toLowerCase().includes(q),
          })
        }
      }
      results.sort((a, b) => Number(b.exactName) - Number(a.exactName))
      const top = results.slice(0, max)
      for (const result of top) delete result.exactName
      return reply({
        query: q,
        matches: results.length,
        results: top,
        note: results.length > max ? `Showing ${max} of ${results.length} matches; raise "limit" for more.` : undefined,
      })
    },
  },
  {
    name: 'list_ai_know_sections',
    description:
      'List every section of the ai-know.org knowledge base — concept sections and curated tool sections — with how many items each holds and the URL of its page and markdown twin.',
    inputSchema: { type: 'object', properties: {} },
    async execute() {
      const describe = (kind: string) => (section: { id: string; title: string; items: unknown[] }) => ({
        kind,
        id: section.id,
        title: section.title,
        items: section.items.length,
        page: `${SITE}/${section.id}/`,
        markdown: `${SITE}/${section.id}.md`,
      })
      return reply({
        sections: [...getConcepts('en').map(describe('concepts')), ...getTools('en').map(describe('tools'))],
        alsoAvailable: {
          news: `${SITE}/hot-news/`,
          calculator: `${SITE}/calculator/`,
          index: `${SITE}/llms.txt`,
          everything: `${SITE}/llms-full.txt`,
          catalog: `${SITE}/.well-known/ai-catalog.json`,
        },
      })
    },
  },
  {
    name: 'get_ai_know_page',
    description:
      'Fetch the full markdown text of one ai-know.org page (its .md twin), for example "ai-basics", "chat-tools" or "hot-news".',
    inputSchema: {
      type: 'object',
      properties: { page: { type: 'string', description: 'Page path without extension, e.g. "ai-basics".' } },
      required: ['page'],
    },
    async execute({ page }) {
      const slug = String(page ?? '').trim().replace(/^\/+|\/+$/g, '').replace(/\.md$/, '')
      if (!/^[a-z0-9][a-z0-9_-]*$/i.test(slug)) {
        return reply('Pass a single page slug such as "ai-basics" — no paths, no URLs.')
      }
      const response = await fetch(`/${slug}.md`, { headers: { Accept: 'text/markdown, text/plain' } })
      if (!response.ok) {
        return reply(`No page called "${slug}" (HTTP ${response.status}). Call list_ai_know_sections for the valid slugs.`)
      }
      return reply(await response.text())
    },
  },
]

function host(): ModelContextHost | undefined {
  const fromNavigator = (navigator as Navigator & { modelContext?: ModelContextHost }).modelContext
  const fromDocument = (document as Document & { modelContext?: ModelContextHost }).modelContext
  return fromNavigator ?? fromDocument
}

export function registerWebMcpTools(): boolean {
  try {
    const target = host()
    if (!target) return false
    if (typeof target.registerTool === 'function') {
      for (const tool of TOOLS) target.registerTool(tool)
      return true
    }
    if (typeof target.provideContext === 'function') {
      target.provideContext({ tools: TOOLS })
      return true
    }
    return false
  } catch {
    // An agent host that rejects a registration must never break the page.
    return false
  }
}

export const webMcpToolNames = TOOLS.map((tool) => tool.name)
