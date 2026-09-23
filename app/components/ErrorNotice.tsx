'use client'

import {useCallback, useEffect, useState} from 'react'

type Kind = 'RATE_LIMIT' | 'AUTH' | 'UPSTREAM' | 'CONFIG' | 'UNKNOWN'

type Parsed = {
  kind: Kind
  retryAfter: number
  message: string
}

const KINDS: Kind[] = ['RATE_LIMIT', 'AUTH', 'UPSTREAM', 'CONFIG', 'UNKNOWN']

export function parseError(raw: string | undefined): Parsed {
  const fallback: Parsed = {
    kind: 'UNKNOWN',
    retryAfter: 0,
    message: raw?.trim() || 'Something went wrong reaching the knowledge base.',
  }
  if (!raw) return fallback

  const parts = raw.split('|')
  if (parts.length < 3) return fallback

  const [code, retry, ...rest] = parts
  if (!KINDS.includes(code as Kind)) return fallback

  const seconds = Number.parseInt(retry, 10)
  return {
    kind: code as Kind,
    retryAfter: Number.isFinite(seconds) && seconds > 0 ? seconds : 0,
    message: rest.join('|').trim() || fallback.message,
  }
}

const COPY: Record<Kind, {title: string; hint: string}> = {
  RATE_LIMIT: {
    title: 'Rate limited',
    hint: 'This demo runs on a shared free-tier quota of a few requests per minute. Nothing is broken — it just needs a moment.',
  },
  AUTH: {
    title: 'Credentials rejected',
    hint: 'The deployment’s API key is missing or invalid. Retrying will not help until it is fixed.',
  },
  UPSTREAM: {
    title: 'Provider unavailable',
    hint: 'The model provider returned a server error. Retrying usually works.',
  },
  CONFIG: {
    title: 'Not configured',
    hint: 'The server is missing the knowledge base connection details.',
  },
  UNKNOWN: {
    title: 'Translation failed',
    hint: '',
  },
}

const RETRYABLE: Kind[] = ['RATE_LIMIT', 'UPSTREAM', 'UNKNOWN']

export function ErrorNotice({
  raw,
  onRetry,
  onCooldownChange,
}: {
  raw?: string
  onRetry: () => void
  onCooldownChange?: (active: boolean) => void
}) {
  const {kind, retryAfter, message} = parseError(raw)
  const copy = COPY[kind]
  const canRetry = RETRYABLE.includes(kind)
  const [done, setDone] = useState(false)
  const onDone = useCallback(() => setDone(true), [])

  const waiting = canRetry && retryAfter > 0 && !done

  return (
    <div
      role="alert"
      className="rr-rise border border-[var(--danger-border)] bg-[var(--danger-soft)] p-5"
    >
      <div className="flex items-center gap-2">
        <span className="rr-label text-[var(--danger)]">
          {copy.title}
        </span>
        {kind === 'RATE_LIMIT' && (
          <span className="rr-label rounded-full border border-[var(--danger-border)] px-2.5 py-0.5 text-[var(--danger)]">
            429
          </span>
        )}
      </div>

      <p className="mt-3 text-[14px] leading-[22px] text-[var(--text-secondary)]">{message}</p>
      {copy.hint && <p className="mt-2 text-[13px] leading-[20px] text-[var(--text-primary)]">{copy.hint}</p>}

      {canRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={waiting}
          className="rr-label mt-5 inline-flex h-10 items-center rounded-full border border-[var(--danger-border)] px-5 text-[var(--danger)] transition-colors duration-150 hover:bg-[var(--danger-border)]/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {waiting ? (
            <Countdown
              key={`${raw}-${retryAfter}`}
              seconds={retryAfter}
              onDone={onDone}
              onCooldownChange={onCooldownChange}
            />
          ) : (
            'Try again'
          )}
        </button>
      )}
    </div>
  )
}

function Countdown({
  seconds,
  onDone,
  onCooldownChange,
}: {
  seconds: number
  onDone: () => void
  onCooldownChange?: (active: boolean) => void
}) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    onCooldownChange?.(true)
    const deadline = Date.now() + seconds * 1000
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0) {
        clearInterval(id)
        onDone()
      }
    }, 500)
    return () => {
      clearInterval(id)
      onCooldownChange?.(false)
    }
  }, [seconds, onDone, onCooldownChange])

  return <>Try again in {remaining}s</>
}
