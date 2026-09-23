import type {Metadata, Viewport} from 'next'
import {Newsreader, Inter, JetBrains_Mono} from 'next/font/google'
import './globals.css'
import {SITE_URL} from './siteUrl'

const display = Newsreader({
  variable: '--font-display-stack',
  subsets: ['latin'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const sans = Inter({
  variable: '--font-sans-stack',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
})

const mono = JetBrains_Mono({
  variable: '--font-mono-stack',
  subsets: ['latin'],
  display: 'swap',
})

const DESCRIPTION =
  'Translate Next.js code between the Pages Router and the App Router, with a citation for every claim.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Router Rosetta',
  description: DESCRIPTION,
  applicationName: 'Router Rosetta',
  openGraph: {
    title: 'Router Rosetta',
    description: DESCRIPTION,
    siteName: 'Router Rosetta',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Router Rosetta',
    description: DESCRIPTION,
  },
}

export const viewport: Viewport = {
  themeColor: [
    {media: '(prefers-color-scheme: light)', color: '#FFFFFF'},
    {media: '(prefers-color-scheme: dark)', color: '#0A0A0A'},
  ],
}

const THEME_SCRIPT = `try{var t=localStorage.getItem('rr-theme');document.documentElement.dataset.theme=t==='dark'?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}`

export default function RootLayout({children}: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{__html: THEME_SCRIPT}} />
      </head>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  )
}
