// WebMCP annotates interactive elements with toolname/tooldescription so an
// agent can discover what a form does without guessing from labels. They are
// plain lowercase HTML attributes, which React passes straight through — they
// only need declaring so TypeScript accepts them.
import 'react'

declare module 'react' {
  interface HTMLAttributes<T> {
    toolname?: string
    tooldescription?: string
  }
}
