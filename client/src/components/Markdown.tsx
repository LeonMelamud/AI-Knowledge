import ReactMarkdown from 'react-markdown'

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown text-sm leading-relaxed text-ink-muted">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  )
}
