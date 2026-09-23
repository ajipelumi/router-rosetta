import type {Metadata} from 'next'
import {Newsreader, Inter, JetBrains_Mono} from 'next/font/google'
import './globals.css'

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

export const metadata: Metadata = {
  title: 'Router Rosetta',
  description:
    'Translate Next.js code between the Pages Router and the App Router, with a citation for every claim.',
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
