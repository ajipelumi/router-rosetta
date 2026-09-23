import assert from 'node:assert/strict'
import {describe, test} from 'node:test'
import type {UIMessage} from 'ai'
import {cacheKey, readCache, writeCache} from './cache'

const userMsg = (text: string): UIMessage => ({
  id: '1',
  role: 'user',
  parts: [{type: 'text', text}],
})

describe('cacheKey', () => {
  test('keys a single user turn', () => {
    assert.ok(cacheKey([userMsg('hello')]))
  })

  test('gives the same key for identical prompts', () => {
    assert.equal(cacheKey([userMsg('same')]), cacheKey([userMsg('same')]))
  })

  test('gives different keys for different prompts', () => {
    assert.notEqual(cacheKey([userMsg('a')]), cacheKey([userMsg('b')]))
  })

  test('ignores surrounding whitespace', () => {
    assert.equal(cacheKey([userMsg('  hi  ')]), cacheKey([userMsg('hi')]))
  })

  test('refuses multi-turn conversations', () => {
    const history: UIMessage[] = [
      userMsg('first'),
      {id: '2', role: 'assistant', parts: [{type: 'text', text: 'reply'}]},
      userMsg('second'),
    ]
    assert.equal(cacheKey(history), null)
  })

  test('refuses an empty prompt', () => {
    assert.equal(cacheKey([userMsg('   ')]), null)
  })

  test('refuses a non-user first turn', () => {
    const msg: UIMessage = {id: '1', role: 'assistant', parts: [{type: 'text', text: 'x'}]}
    assert.equal(cacheKey([msg]), null)
  })
})

describe('read and write', () => {
  test('returns what was stored', () => {
    const key = cacheKey([userMsg('roundtrip')])!
    writeCache(key, 'the answer')
    assert.equal(readCache(key), 'the answer')
  })

  test('misses on an unknown key', () => {
    assert.equal(readCache('nope'), null)
  })

  test('refuses to store an empty answer', () => {
    const key = cacheKey([userMsg('empty-answer')])!
    writeCache(key, '   ')
    assert.equal(readCache(key), null)
  })

  test('evicts the oldest entry past the cap', () => {
    const first = cacheKey([userMsg('evict-me')])!
    writeCache(first, 'oldest')

    for (let i = 0; i < 70; i++) {
      writeCache(cacheKey([userMsg(`filler-${i}`)])!, `v${i}`)
    }

    assert.equal(readCache(first), null)
    assert.equal(readCache(cacheKey([userMsg('filler-69')])!), 'v69')
  })
})
