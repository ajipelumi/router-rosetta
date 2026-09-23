import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center px-5 text-center">
      <div className="rr-label text-[var(--primary)]">404</div>
      <h1 className="rr-display mt-4 text-[30px] leading-[36px] text-[var(--text-secondary)] sm:text-[38px] sm:leading-[44px]">
        No such page
      </h1>
      <p className="rr-body-track mt-4 max-w-md text-[var(--text-primary)]">
        Router Rosetta is a single page. Whatever you were looking for is not here.
      </p>
      <Link
        href="/"
        className="rr-label mt-8 inline-flex h-11 items-center rounded-full bg-[var(--primary)] px-7 text-[var(--accent-contrast)] transition-colors duration-150 hover:bg-[var(--secondary)]"
      >
        Back to the translator
      </Link>
    </div>
  )
}
