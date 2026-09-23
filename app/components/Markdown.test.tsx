import assert from 'node:assert/strict'
import {test, describe} from 'node:test'
import {renderToStaticMarkup} from 'react-dom/server'
import {Markdown} from './Markdown'

const html = (src: string) => renderToStaticMarkup(<Markdown text={src} />)

const citations = (src: string) =>
  [...html(src).matchAll(/Knowledge base entry: ([^"]+)"/g)].map((m) => m[1])

const count = (src: string, tag: string) => (html(src).match(new RegExp(`<${tag}[ >]`, 'g')) ?? []).length

/** Text as a reader sees it, with tags stripped. */
const text = (src: string) => html(src).replace(/<[^>]+>/g, '')

describe('headings', () => {
  test('renders a heading followed by a blank line', () => {
    assert.equal(count('### Key Differences\n\nBody.', 'h3'), 1)
  })

  test('renders a heading followed immediately by text', () => {
    const src = '### Key Differences\nThe App Router does X.'
    assert.equal(count(src, 'h3'), 1)
    assert.doesNotMatch(text(src), /#/)
  })

  test('maps levels to tags', () => {
    assert.equal(count('# One\ntext', 'h2'), 1)
    assert.equal(count('## Two\ntext', 'h2'), 1)
    assert.equal(count('### Three\ntext', 'h3'), 1)
    assert.equal(count('#### Four\ntext', 'h4'), 1)
  })

  test('never leaks a literal hash', () => {
    assert.doesNotMatch(text('## A\n### B\n#### C\nbody'), /#/)
  })

  test('leaves a bare hash that is not a heading', () => {
    assert.equal(count('Issue #42 is open.', 'h2'), 0)
    assert.equal(count('Issue #42 is open.', 'h3'), 0)
  })
})

describe('citations', () => {
  test('renders a single citation as one chip', () => {
    assert.deepEqual(citations('Text [data_fetching/pages_static].'), [
      'data_fetching/pages_static',
    ])
  })

  test('splits a comma-separated bracket into one chip per path', () => {
    assert.deepEqual(citations('Component [data_fetching/app_router, migration].'), [
      'data_fetching/app_router',
      'migration',
    ])
  })

  test('tolerates surrounding whitespace', () => {
    assert.deepEqual(citations('See [ routing/app_router ,  migration ] here.'), [
      'routing/app_router',
      'migration',
    ])
  })

  test('tolerates spaces inside the brackets', () => {
    // gpt-oss emits "[ data_fetching/pages_static ]" with inner padding.
    assert.deepEqual(citations('runs per request [ data_fetching/pages_static ].'), [
      'data_fetching/pages_static',
    ])
    assert.deepEqual(citations('behaves like SSR [ migration ].'), ['migration'])
  })

  test('accepts the CJK corner brackets gpt-oss emits', () => {
    assert.deepEqual(citations('docs 【routing/app_router】.'), ['routing/app_router'])
    assert.deepEqual(citations('see 【data_fetching/app_router, migration】 ok'), [
      'data_fetching/app_router',
      'migration',
    ])
  })

  test('recognises the bare migration entry', () => {
    assert.deepEqual(citations('Maps to that [migration].'), ['migration'])
  })

  test('leaves ordinary brackets alone', () => {
    assert.deepEqual(citations('An array [1, 2, 3] stays text.'), [])
    assert.deepEqual(citations('A [Link](http://x) stays text.'), [])
    assert.deepEqual(citations('Something [TODO] stays text.'), [])
  })

  test('colour-codes by router', () => {
    assert.match(html('[data_fetching/pages_static]'), /--pages-border/)
    assert.match(html('[routing/app_router]'), /--app-border/)
    assert.match(html('[migration]'), /--border-strong/)
  })
})

describe('code', () => {
  test('renders a fenced block with its language', () => {
    const out = html('Before\n\n```tsx\nconst a = 1\n```\n\nAfter')
    assert.equal((out.match(/<pre[ >]/g) ?? []).length, 1)
    assert.match(out, /tsx/)
    assert.match(out, /const a = 1/)
  })

  test('renders an unterminated fence while it streams', () => {
    const out = html('Here:\n\n```tsx\nconst partial = ')
    assert.equal((out.match(/<pre[ >]/g) ?? []).length, 1)
    assert.doesNotMatch(text('Here:\n\n```tsx\nconst partial = '), /```/)
  })

  test('escapes markup inside code', () => {
    const out = html('```tsx\n<script>alert(1)</script>\n```')
    assert.doesNotMatch(out, /<script>/)
    assert.match(out, /&lt;script&gt;/)
  })

  test('renders inline code', () => {
    assert.equal(count('Use `fetch` here.', 'code'), 1)
  })
})

describe('lists and rules', () => {
  test('groups consecutive bullets into one list', () => {
    const out = html('- One\n- Two\n- Three')
    assert.equal((out.match(/<ul[ >]/g) ?? []).length, 1)
    assert.equal((out.match(/<li[ >]/g) ?? []).length, 3)
  })

  test('accepts a list straight after a heading', () => {
    const out = html('### Heading\n- One\n- Two')
    assert.equal((out.match(/<ul[ >]/g) ?? []).length, 1)
    assert.equal((out.match(/<li[ >]/g) ?? []).length, 2)
  })

  test('handles numbered lists', () => {
    assert.equal((html('1. One\n2. Two').match(/<li[ >]/g) ?? []).length, 2)
  })

  test('renders a horizontal rule and never a literal one', () => {
    const src = 'Above.\n\n---\n\nBelow.'
    assert.equal(count(src, 'hr'), 1)
    assert.doesNotMatch(text(src), /---/)
  })
})

describe('gfm constructs', () => {
  test('renders a pipe table', () => {
    const src = [
      '| Router | Access |',
      '|---|---|',
      '| App | `searchParams` |',
      '| Pages | `useRouter().query` |',
    ].join('\n')
    assert.equal(count(src, 'table'), 1)
    assert.equal(count(src, 'th'), 2)
    assert.equal(count(src, 'td'), 4)
    assert.doesNotMatch(text(src), /\|---/)
  })

  test('renders italic with either marker', () => {
    assert.equal(count('*Search Params* here', 'em'), 1)
    assert.equal(count('_emphasis_ here', 'em'), 1)
    assert.doesNotMatch(text('*Search Params* here'), /\*/)
  })

  test('keeps bold distinct from italic', () => {
    assert.equal(count('**Bold**', 'strong'), 1)
    assert.equal(count('**Bold**', 'em'), 0)
  })

  test('renders nested lists', () => {
    assert.equal(count('- a\n  - b\n- c', 'ul'), 2)
  })

  test('renders blockquotes and links', () => {
    assert.equal(count('> quoted', 'blockquote'), 1)
    assert.equal(count('[docs](https://nextjs.org)', 'a'), 1)
  })

  test('leaves snake_case identifiers alone', () => {
    assert.match(text('The data_fetching_pages value.'), /data_fetching_pages/)
  })
})

describe('safety', () => {
  test('escapes raw html in prose', () => {
    const out = html('<img src=x onerror=alert(1)>')
    assert.doesNotMatch(out, /<img/)
  })

  test('renders bold', () => {
    assert.equal(count('This is **bold** text.', 'strong'), 1)
  })

  test('survives empty and whitespace input', () => {
    assert.doesNotThrow(() => html(''))
    assert.doesNotThrow(() => html('\n\n  \n'))
  })
})
