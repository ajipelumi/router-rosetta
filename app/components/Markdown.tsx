import type {ReactNode} from 'react'
import ReactMarkdown, {type Components} from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {CodeBlock} from './CodeBlock'

const CITATION_PATH = String.raw`(?:[a-z0-9_]+\/[a-z0-9_/]+|migration)`
const CITATION_LIST = String.raw`\s*${CITATION_PATH}(?:\s*,\s*${CITATION_PATH})*\s*`

// Models do not agree on the bracket. gpt-oss often emits the CJK corner
// brackets 【 】 instead of [ ], so both are accepted.
const CITATION_RE = new RegExp(
  String.raw`\[${CITATION_LIST}\]|【${CITATION_LIST}】`,
  'gi',
)

export function Citation({path}: {path: string}) {
  const isPages = /(^|_|\/)pages(_|\/|$)/.test(path)
  const isApp = /(^|_|\/)app(_|\/|$)/.test(path)

  const tone = isPages
    ? 'border-[var(--pages-border)] bg-[var(--pages-soft)] text-[var(--pages)]'
    : isApp
      ? 'border-[var(--app-border)] bg-[var(--app-soft)] text-[var(--app)]'
      : 'border-[var(--border-strong)] bg-[var(--surface-sunken)] text-[var(--muted)]'

  return (
    <span
      className={`mx-1 inline-flex items-baseline rounded-full border px-2.5 py-0.5 align-baseline font-mono text-[11px] ${tone}`}
      title={`Knowledge base entry: ${path}`}
    >
      {path}
    </span>
  )
}

/**
 * Citations like [data_fetching/pages_static] are not markdown, so they survive
 * parsing as plain text and are replaced here. Only strings are touched, which
 * keeps them out of code, links and other already-parsed nodes.
 */
function withCitations(children: ReactNode, keyBase: string): ReactNode {
  if (typeof children === 'string') return splitCitations(children, keyBase)
  if (Array.isArray(children)) {
    return children.map((child, i) =>
      typeof child === 'string' ? splitCitations(child, `${keyBase}-${i}`) : child,
    )
  }
  return children
}

function splitCitations(text: string, keyBase: string): ReactNode {
  const out: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  const re = new RegExp(CITATION_RE.source, 'gi')

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const paths = m[0]
      .slice(1, -1)
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    for (const [i, path] of paths.entries()) {
      out.push(<Citation key={`${keyBase}-${m.index}-${i}`} path={path} />)
    }
    last = m.index + m[0].length
  }

  if (!out.length) return text
  if (last < text.length) out.push(text.slice(last))
  return out
}

const HEADING = 'rr-display text-[var(--text-secondary)] first:mt-0'

const components: Components = {
  h1: ({children}) => (
    <h2 className={`${HEADING} mt-6 mb-2 text-[26px] leading-[32px]`}>
      {withCitations(children, 'h1')}
    </h2>
  ),
  h2: ({children}) => (
    <h2 className={`${HEADING} mt-6 mb-2 text-[22px] leading-[28px]`}>
      {withCitations(children, 'h2')}
    </h2>
  ),
  h3: ({children}) => (
    <h3 className={`${HEADING} mt-5 mb-2 text-[19px] leading-[25px]`}>
      {withCitations(children, 'h3')}
    </h3>
  ),
  h4: ({children}) => (
    <h4 className="rr-label mt-5 mb-2 text-[var(--primary)] first:mt-0">
      {withCitations(children, 'h4')}
    </h4>
  ),
  p: ({children}) => (
    <p className="my-3 text-[15px] leading-[26px] text-[var(--text-secondary)] first:mt-0 last:mb-0">
      {withCitations(children, 'p')}
    </p>
  ),
  ul: ({children}) => <ul className="my-3 list-disc space-y-1.5 pl-5">{children}</ul>,
  ol: ({children}) => <ol className="my-3 list-decimal space-y-1.5 pl-5">{children}</ol>,
  li: ({children}) => (
    <li className="text-[15px] leading-[26px] text-[var(--text-secondary)] marker:text-[var(--primary)]">
      {withCitations(children, 'li')}
    </li>
  ),
  // Emphasis wrappers carry citations too, so they run through the same pass.
  strong: ({children}) => (
    <strong className="font-semibold">{withCitations(children, 'strong')}</strong>
  ),
  em: ({children}) => <em className="italic">{withCitations(children, 'em')}</em>,
  del: ({children}) => <del className="opacity-60">{withCitations(children, 'del')}</del>,
  hr: () => <hr className="my-5 border-0 border-t border-[var(--border)]" />,
  a: ({href, children}) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="text-[var(--primary)] underline underline-offset-2"
    >
      {children}
    </a>
  ),
  blockquote: ({children}) => (
    <blockquote className="my-4 border-l-2 border-[var(--primary)] pl-4 text-[var(--text-primary)]">
      {children}
    </blockquote>
  ),
  table: ({children}) => (
    <div className="my-4 overflow-x-auto border border-[var(--border-strong)]">
      <table className="w-full border-collapse text-[14px]">{children}</table>
    </div>
  ),
  thead: ({children}) => <thead className="bg-[var(--surface-sunken)]">{children}</thead>,
  tr: ({children}) => <tr className="border-b border-[var(--border)] last:border-0">{children}</tr>,
  th: ({children}) => (
    <th className="rr-label px-4 py-2.5 text-left text-[var(--primary)]">
      {withCitations(children, 'th')}
    </th>
  ),
  td: ({children}) => (
    <td className="px-4 py-2.5 align-top text-[var(--text-secondary)]">
      {withCitations(children, 'td')}
    </td>
  ),
  code: ({className, children, ...props}) => {
    const lang = /language-(\w+)/.exec(className ?? '')?.[1]
    const body = String(children).replace(/\n$/, '')

    // react-markdown marks fenced blocks with a language class and wraps them
    // in <pre>; anything else is inline.
    const isBlock = 'node' in props && (lang != null || body.includes('\n'))
    if (isBlock) return <CodeBlock lang={lang} code={body} />

    return (
      <code className="border border-[var(--border)] bg-[var(--surface-sunken)] px-1.5 py-px font-mono text-[0.9em] text-[var(--primary)]">
        {children}
      </code>
    )
  },
  // CodeBlock renders its own <figure>/<pre>, so the wrapper is dropped.
  pre: ({children}) => <>{children}</>,
}

export function Markdown({text}: {text: string}) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {text}
    </ReactMarkdown>
  )
}
