import ReactMarkdown from 'react-markdown'

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown text-sm leading-relaxed text-slate-700">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  )
}
