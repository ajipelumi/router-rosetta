import {createHash} from 'node:crypto'
import type {UIMessage} from 'ai'

type Entry = {text: string; at: number}

const TTL_MS = 24 * 60 * 60 * 1000
const MAX_ENTRIES = 64

/**
 * Process-local cache for first-turn answers.
 *
 * The four example buttons send byte-identical prompts every time, so in a
 * demo they account for most traffic while producing the same answer. Serving
 * those from memory keeps the provider quota for questions people actually
 * type.
 *
 * Deliberately not cached: anything with conversation history, since the reply
 * depends on turns this key does not capture. A Map is enough — it is a warm
 * path optimisation, not a source of truth, and a cold start simply refills it.
 */
const store = new Map<string, Entry>()

/** Cache only single-turn user prompts; follow-ups depend on history. */
export function cacheKey(messages: UIMessage[]): string | null {
  if (messages.length !== 1) return null

  const [only] = messages
  if (only.role !== 'user') return null

  const text = only.parts
    .filter((p): p is {type: 'text'; text: string} => p.type === 'text')
    .map((p) => p.text)
    .join('')
    .trim()

  if (!text) return null
  return createHash('sha256').update(text).digest('hex')
}

export function readCache(key: string): string | null {
  const hit = store.get(key)
  if (!hit) return null

  if (Date.now() - hit.at > TTL_MS) {
    store.delete(key)
    return null
  }

  // Refresh recency so the popular examples survive eviction.
  store.delete(key)
  store.set(key, hit)
  return hit.text
}

export function writeCache(key: string, text: string) {
  if (!text.trim()) return

  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next()
    if (!oldest.done) store.delete(oldest.value)
  }
  store.set(key, {text, at: Date.now()})
}
