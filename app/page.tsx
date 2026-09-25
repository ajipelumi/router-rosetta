'use client'

import {useChat} from '@ai-sdk/react'
import {DefaultChatTransport} from 'ai'
import {useCallback, useEffect, useRef, useState} from 'react'
import {ErrorNotice} from './components/ErrorNotice'
import {HazeField} from './components/HazeField'
import {Markdown} from './components/Markdown'
import {ThemeToggle} from './components/ThemeToggle'
import {useLocalRateLimit} from './components/useLocalRateLimit'

const EXAMPLES = [
  {
    label: 'getServerSideProps',
    hint: 'Pages → App',
    body: `export async function getServerSideProps() {
  const res = await fetch('https://api.example.com/posts')
  return {props: {posts: await res.json()}}
}`,
  },
  {
    label: 'getStaticPaths fallback',
    hint: 'Pages → App',
    body: `export async function getStaticPaths() {
  return {paths: [{params: {id: '1'}}], fallback: 'blocking'}
}`,
  },
  {
    label: 'Custom App',
    hint: 'Pages → App',
    body: `// pages/_app.js
export default function MyApp({Component, pageProps}) {
  return <Component {...pageProps} />
}`,
  },
  {
    label: 'A question',
    hint: 'Either way',
    body: 'How do I read search params in each router?',
  },
]

export default function Page() {
  const [input, setInput] = useState('')
  const {messages, sendMessage, status, error, regenerate, setMessages} = useChat({
    transport: new DefaultChatTransport({api: '/api/translate'}),
  })

  const busy = status === 'submitted' || status === 'streaming'
  const lastMessage = messages[messages.length - 1]
  const hasVisibleText = lastMessage?.parts.some(
    (p) => p.type === 'text' && p.text.trim().length > 0,
  )
  const thinking = busy && !hasVisibleText

  const [cooling, setCooling] = useState(false)
  const onCooldownChange = useCallback((active: boolean) => setCooling(active), [])
  const local = useLocalRateLimit()
  const blocked = busy || cooling || local.blocked

  const [attempt, setAttempt] = useState(0)
  const onRetry = useCallback(() => {
    if (!local.check()) return
    local.record()
    setAttempt((n) => n + 1)
    regenerate()
  }, [regenerate, local])

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!thinking) return
    transcriptRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'})
  }, [thinking])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [input])

  function submit(text: string) {
    if (!text.trim() || blocked || !local.check()) return
    local.record()
    setAttempt((n) => n + 1)
    sendMessage({text})
    setInput('')
  }

  const empty = messages.length === 0

  return (
    <>
      <HazeField />

      <div className="flex min-h-dvh w-full flex-col px-5 sm:px-8 lg:px-14">
        <header className="flex items-end justify-between gap-4 border-b border-[var(--border)] py-4 [@media(min-height:700px)]:py-6 lg:[@media(min-height:760px)]:py-8">
          <div className="min-w-0">
            <div className="rr-label text-[var(--primary)]">Next.js Router Translator</div>

            <h1 className="rr-display mt-3 text-[26px] leading-[32px] text-[var(--text-secondary)] [@media(min-height:700px)]:text-[30px] [@media(min-height:700px)]:leading-[36px] sm:[@media(min-height:760px)]:text-[38px] sm:[@media(min-height:760px)]:leading-[44px]">
              Router <span className="italic">Rosetta</span>
            </h1>

            <p className="rr-body-track mt-3 max-w-xl text-[var(--text-primary)]">
              Paste Next.js code or ask a question. It names the router, returns the equivalent,
              and cites the docs entry for every claim.
            </p>

            <div className="mt-4 hidden items-center gap-2 sm:[@media(min-height:700px)]:flex">
              <span className="rr-label rounded-full border border-[var(--pages-border)] px-3 py-1.5 text-[var(--pages)]">
                pages
              </span>
              <span aria-hidden className="text-[var(--primary)]">
                ⇄
              </span>
              <span className="rr-label rounded-full bg-[var(--primary)] px-3 py-1.5 text-[var(--accent-contrast)]">
                app
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!empty && (
              <button
                type="button"
                onClick={() => {
                  setMessages([])
                  setInput('')
                  window.scrollTo({top: 0, behavior: 'smooth'})
                }}
                className="rr-label hidden h-10 items-center rounded-full border border-[var(--border-strong)] px-5 text-[var(--text-primary)] transition-colors duration-150 hover:border-[var(--primary)] hover:text-[var(--primary)] sm:inline-flex"
              >
                New translation
              </button>
            )}
            <ThemeToggle />
          </div>
        </header>

        <main className="flex flex-1 flex-col py-6">
          {empty && (
            <div className="rr-rise rr-shell rr-elevated">
              <div className="bg-[var(--surface)] p-3 [@media(min-height:620px)]:p-4 sm:[@media(min-height:700px)]:p-5">
                <div className="rr-label text-[var(--primary)]">Start with an example</div>
                <p className="rr-body-track mt-2 hidden text-[var(--text-primary)] [@media(min-height:620px)]:block">
                  Or paste your own code below — a data-fetching function, a config export, a
                  whole file.
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2 [@media(min-height:620px)]:mt-4 [@media(max-height:620px)]:sm:grid-cols-4">
                  {EXAMPLES.map((e, i) => (
                    <button
                      key={e.label}
                      onClick={() => submit(e.body)}
                      disabled={blocked}
                      style={{animationDelay: `${i * 90}ms`}}
                      className="rr-rise group border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-left [@media(min-height:620px)]:py-3 transition-colors duration-150 hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="truncate font-mono text-[13px] text-[var(--text-secondary)] transition-colors duration-150 group-hover:text-[var(--primary)]">
                        {e.label}
                      </div>
                      <div className="rr-label mt-1.5 text-[var(--text-primary)]">{e.hint}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div
            ref={transcriptRef}
            role="log"
            aria-live="polite"
            aria-atomic="false"
            aria-label="Translation transcript"
          >
            <div className="flex flex-col gap-3 pb-6">
              {messages.map((m) => {
                const isUser = m.role === 'user'
                return (
                  <article
                    key={m.id}
                    className={
                      isUser
                        ? 'rr-rise border border-[var(--border)] bg-[var(--surface-sunken)] p-5'
                        : 'rr-rise rr-hairline border border-[var(--border-strong)] bg-[var(--surface)] p-5'
                    }
                  >
                    <div
                      className={`rr-label mb-3 ${
                        isUser ? 'text-[var(--text-primary)]' : 'text-[var(--primary)]'
                      }`}
                    >
                      {isUser ? 'You' : 'Router Rosetta'}
                    </div>

                    {m.parts.map((part, i) => {
                      if (part.type === 'text') {
                        return isUser ? (
                          <div
                            key={i}
                            className="font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-[var(--text-secondary)]"
                          >
                            {part.text}
                          </div>
                        ) : (
                          <Markdown key={i} text={part.text} />
                        )
                      }

                      if (part.type.startsWith('tool-')) {
                        return (
                          <div
                            key={i}
                            className="rr-label mt-3 flex items-center gap-2 text-[var(--text-primary)]"
                          >
                            <span aria-hidden className="text-[var(--primary)]">
                              ↳
                            </span>
                            <span>consulted {part.type.replace(/^tool-/, '')}</span>
                          </div>
                        )
                      }

                      return null
                    })}
                  </article>
                )
              })}

              {thinking && (
                <div className="rr-rise rr-label flex items-center gap-2 text-[var(--text-primary)]">
                  <span className="rr-dot text-[var(--primary)]">●</span>
                  Reading the knowledge base
                </div>
              )}

              {error && (
                <ErrorNotice
                  key={`${attempt}-${error.message}`}
                  raw={error.message}
                  onRetry={onRetry}
                  onCooldownChange={onCooldownChange}
                />
              )}
            </div>
          </div>

          {!busy && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submit(input)
            }}
            className={`rr-shell ${empty ? 'mt-auto' : 'mt-6'}`}
          >
            <div className="bg-[var(--surface)] p-4">
              <label htmlFor="source" className="sr-only">
                Next.js code or question to translate
              </label>
              <textarea
                id="source"
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    submit(input)
                  }
                }}
                rows={2}
                placeholder="Paste Next.js code, or ask how something maps between the routers…"
                className="w-full resize-none border border-[var(--border)] bg-[var(--surface)] p-3.5 font-mono text-[13px] leading-relaxed text-[var(--text-secondary)] transition-colors duration-150 placeholder:text-[var(--text-primary)] focus:border-[var(--primary)]"
              />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <span className="rr-label text-[var(--text-primary)]">
                  ⌘ / Ctrl + ↵ to translate
                  {local.blocked ? (
                    <span className="ml-3 text-[var(--danger)]">
                      slow down — {local.waitSeconds}s
                    </span>
                  ) : (
                    local.remaining <= 2 && (
                      <span className="ml-3 text-[var(--primary)]">
                        {local.remaining} of {local.limit} left
                      </span>
                    )
                  )}
                </span>

                <button
                  type="submit"
                  disabled={blocked || !input.trim()}
                  title={
                    cooling
                      ? 'Waiting out the shared rate limit'
                      : local.blocked
                        ? `You have sent ${local.limit} requests in the last minute`
                        : !input.trim()
                          ? 'Enter some code or a question first'
                          : undefined
                  }
                  className="rr-label inline-flex h-11 items-center rounded-full bg-[var(--primary)] px-7 text-[var(--accent-contrast)] transition-colors duration-150 hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy
                    ? 'Translating'
                    : cooling
                      ? 'Rate limited'
                      : local.blocked
                        ? `Wait ${local.waitSeconds}s`
                        : 'Translate'}
                </button>
              </div>
            </div>
          </form>
          )}
        </main>
      </div>
    </>
  )
}
