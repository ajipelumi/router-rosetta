'use client'

import {useEffect} from 'react'

export default function Error({
  error,
  retry,
}: {
  error: Error & {digest?: string}
  retry: () => void
}) {
  useEffect(() => {
    console.error('[router-rosetta]', error)
  }, [error])

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center px-5 text-center">
      <div className="rr-label text-[var(--danger)]">Something broke</div>
      <h1 className="rr-display mt-4 text-[30px] leading-[36px] text-[var(--text-secondary)] sm:text-[38px] sm:leading-[44px]">
        The page did not load
      </h1>
      <p className="rr-body-track mt-4 max-w-md text-[var(--text-primary)]">
        This is a fault in the app itself, not a failed translation. Retrying usually works.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-[12px] text-[var(--text-primary)]">
          Reference: {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={() => retry()}
        className="rr-label mt-8 inline-flex h-11 items-center rounded-full bg-[var(--primary)] px-7 text-[var(--accent-contrast)] transition-colors duration-150 hover:bg-[var(--secondary)]"
      >
        Try again
      </button>
    </div>
  )
}
