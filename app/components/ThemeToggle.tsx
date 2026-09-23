'use client'

import {useCallback, useSyncExternalStore} from 'react'

export type Theme = 'light' | 'dark'

export const THEME_KEY = 'rr-theme'

const listeners = new Set<() => void>()

function subscribe(fn: () => void) {
  listeners.add(fn)
  const onStorage = (e: StorageEvent) => {
    if (e.key !== THEME_KEY) return
    document.documentElement.dataset.theme = e.newValue === 'dark' ? 'dark' : 'light'
    listeners.forEach((l) => l())
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(fn)
    window.removeEventListener('storage', onStorage)
  }
}

const getSnapshot = (): Theme =>
  document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'

const getServerSnapshot = (): Theme => 'light'

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const dark = theme === 'dark'

  const toggle = useCallback(() => {
    const next: Theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {}
    listeners.forEach((l) => l())
  }, [])

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}
      title={`Switch to ${dark ? 'light' : 'dark'} theme`}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] text-[var(--text-primary)] transition-colors duration-150 hover:border-[var(--primary)] hover:text-[var(--primary)]"
    >
      <span className="text-[14px] leading-none">{dark ? '☾' : '☀'}</span>
    </button>
  )
}
