'use client'

import {useState} from 'react'

export function CodeBlock({code, lang}: {code: string; lang?: string}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <figure className="group relative my-4 border border-[var(--border-strong)] bg-[var(--surface-sunken)]">
      <figcaption className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
        <span className="rr-label text-[var(--primary)]">
          {lang || 'code'}
        </span>
        <button
          type="button"
          onClick={copy}
          className="rr-label rounded-full border border-[var(--border-strong)] px-3 py-1 text-[var(--text-primary)] transition-colors duration-150 hover:border-[var(--primary)] hover:text-[var(--primary)]"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </figcaption>
      <pre className="overflow-x-auto p-4">
        <code className="font-mono text-[13px] leading-relaxed">{code}</code>
      </pre>
    </figure>
  )
}
