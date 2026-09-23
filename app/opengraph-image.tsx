import {ImageResponse} from 'next/og'

export const alt =
  'Router Rosetta — translate Next.js code between the Pages Router and the App Router'
export const size = {width: 1200, height: 630}
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0A0A0A',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 22,
            letterSpacing: 4,
            color: '#EA580C',
            textTransform: 'uppercase',
          }}
        >
          Next.js Router Translator
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: 28}}>
          <div style={{display: 'flex', fontSize: 104, color: '#FAFAFA', lineHeight: 1}}>
            Router Rosetta
          </div>
          <div style={{display: 'flex', fontSize: 30, color: '#A3A3A3', maxWidth: 880}}>
            Paste Next.js code or ask a question. It names the router, returns the equivalent, and
            cites the docs entry for every claim.
          </div>
        </div>

        <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
          <div
            style={{
              display: 'flex',
              border: '2px solid #D4D4D4',
              borderRadius: 999,
              padding: '10px 26px',
              fontSize: 22,
              letterSpacing: 3,
              color: '#FAFAFA',
            }}
          >
            PAGES
          </div>
          <svg width="44" height="30" viewBox="0 0 44 30" fill="none">
            <path
              d="M4 10h30M27 3l7 7-7 7"
              stroke="#EA580C"
              strokeWidth="3"
              strokeLinecap="square"
            />
            <path
              d="M40 22H10M17 15l-7 7 7 7"
              stroke="#EA580C"
              strokeWidth="3"
              strokeLinecap="square"
            />
          </svg>
          <div
            style={{
              display: 'flex',
              background: '#EA580C',
              borderRadius: 999,
              padding: '12px 28px',
              fontSize: 22,
              letterSpacing: 3,
              color: '#0A0A0A',
            }}
          >
            APP
          </div>
        </div>
      </div>
    ),
    size,
  )
}
