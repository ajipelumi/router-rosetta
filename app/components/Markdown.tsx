import {Fragment, type ReactNode} from 'react'
import {CodeBlock} from './CodeBlock'

const fenceRe = () => /```(\w+)?\n?([\s\S]*?)```/g
const inlineRe = () => /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[a-z0-9_]+(?:\/[a-z0-9_]+)*\])/gi

function Citation({path}: {path: string}) {
  const inner = path.slice(1, -1)
  const isPages = /(^|_|\/)pages(_|\/|$)/.test(inner)
  const isApp = /(^|_|\/)app(_|\/|$)/.test(inner)

  const tone = isPages
    ? 'border-[var(--pages-border)] bg-[var(--pages-soft)] text-[var(--pages)]'
    : isApp
      ? 'border-[var(--app-border)] bg-[var(--app-soft)] text-[var(--app)]'
      : 'border-[var(--border-strong)] bg-[var(--surface-sunken)] text-[var(--muted)]'

  return (
    <span
      className={`mx-1 inline-flex items-baseline rounded-full border px-2.5 py-0.5 align-baseline font-mono text-[11px] ${tone}`}
      title={`Knowledge base entry: ${inner}`}
    >
      {inner}
    </span>
  )
}

function renderInline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = inlineRe()
  let last = 0
  let m: RegExpExecArray | null

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const token = m[0]

    if (token.startsWith('`')) {
      out.push(
        <code
          key={`${keyBase}-c${m.index}`}
          className="border border-[var(--border)] bg-[var(--surface-sunken)] px-1.5 py-px font-mono text-[0.9em] text-[var(--primary)]"
        >
          {token.slice(1, -1)}
        </code>,
      )
    } else if (token.startsWith('**')) {
      out.push(
        <strong key={`${keyBase}-b${m.index}`} className="font-semibold">
          {token.slice(2, -2)}
        </strong>,
      )
    } else {
      out.push(<Citation key={`${keyBase}-r${m.index}`} path={token} />)
    }
    last = m.index + token.length
  }

  if (last < text.length) out.push(text.slice(last))
  return out
}

const HEADING_STYLES: Record<number, string> = {
  1: 'rr-display mt-6 mb-2 text-[26px] leading-[32px]',
  2: 'rr-display mt-6 mb-2 text-[22px] leading-[28px]',
  3: 'rr-display mt-5 mb-2 text-[19px] leading-[25px]',
  4: 'rr-label mt-5 mb-2 text-[var(--primary)]',
}

function Heading({level, text, keyBase}: {level: number; text: string; keyBase: string}) {
  const Tag = (level <= 2 ? 'h2' : level === 3 ? 'h3' : 'h4') as 'h2' | 'h3' | 'h4'
  const tone = level === 4 ? '' : ' text-[var(--text-secondary)]'
  return (
    <Tag className={`${HEADING_STYLES[level] ?? HEADING_STYLES[3]}${tone} first:mt-0`}>
      {renderInline(text, keyBase)}
    </Tag>
  )
}

function renderProse(text: string, keyBase: string): ReactNode {
  const out: ReactNode[] = []
  const lines = text.split('\n')
  let para: string[] = []
  let list: string[] = []
  let k = 0

  function flushPara() {
    if (!para.length) return
    const body = para
    para = []
    out.push(
      <p
        key={`${keyBase}-p${k++}`}
        className="my-3 text-[15px] leading-[26px] text-[var(--text-secondary)] first:mt-0 last:mb-0"
      >
        {body.map((l, li) => (
          <Fragment key={li}>
            {li > 0 && <br />}
            {renderInline(l, `${keyBase}-p${k}-${li}`)}
          </Fragment>
        ))}
      </p>,
    )
  }

  function flushList() {
    if (!list.length) return
    const items = list
    list = []
    out.push(
      <ul key={`${keyBase}-l${k++}`} className="my-3 list-disc space-y-1.5 pl-5">
        {items.map((l, li) => (
          <li
            key={li}
            className="text-[15px] leading-[26px] text-[var(--text-secondary)] marker:text-[var(--primary)]"
          >
            {renderInline(l, `${keyBase}-l${k}-${li}`)}
          </li>
        ))}
      </ul>,
    )
  }

  function flushAll() {
    flushList()
    flushPara()
  }

  for (const raw of lines) {
    const line = raw.trim()

    if (!line) {
      flushAll()
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      flushAll()
      out.push(
        <Heading
          key={`${keyBase}-h${k++}`}
          level={Math.min(heading[1].length, 4)}
          text={heading[2].replace(/\s+#+\s*$/, '')}
          keyBase={`${keyBase}-h${k}`}
        />,
      )
      continue
    }

    if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushAll()
      out.push(
        <hr key={`${keyBase}-hr${k++}`} className="my-5 border-0 border-t border-[var(--border)]" />,
      )
      continue
    }

    const bullet = line.match(/^(?:[-*+]|\d+\.)\s+(.*)$/)
    if (bullet) {
      flushPara()
      list.push(bullet[1])
      continue
    }

    flushList()
    para.push(line)
  }

  flushAll()
  return out
}

export function Markdown({text}: {text: string}) {
  const out: ReactNode[] = []
  const re = fenceRe()
  let last = 0
  let m: RegExpExecArray | null

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(renderProse(text.slice(last, m.index), `f${m.index}`))
    out.push(<CodeBlock key={`code-${m.index}`} lang={m[1]} code={m[2].replace(/\n$/, '')} />)
    last = m.index + m[0].length
  }

  const tail = text.slice(last)
  const open = tail.indexOf('```')
  if (open !== -1) {
    if (open > 0) out.push(renderProse(tail.slice(0, open), 'tail'))
    const partial = tail.slice(open + 3)
    const nl = partial.indexOf('\n')
    const lang = nl === -1 ? partial : partial.slice(0, nl)
    const body = nl === -1 ? '' : partial.slice(nl + 1)
    out.push(<CodeBlock key="code-open" lang={lang.trim() || undefined} code={body} />)
  } else if (tail) {
    out.push(renderProse(tail, 'tail'))
  }

  return <>{out}</>
}
