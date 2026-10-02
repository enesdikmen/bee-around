import assert from 'node:assert/strict'
import { test } from 'node:test'
import { moduleLoader } from './helpers.mjs'

const freshAnalytics = await moduleLoader('src/lib/analytics.ts')

function fakeWindow(t) {
  const counted = []
  const listeners = {}
  globalThis.window = {
    goatcounter: { count: (vars) => counted.push(vars.path) },
    addEventListener: (type, fn) => { listeners[type] = fn },
  }
  t.after(() => { delete globalThis.window })
  return { counted, listeners }
}

test('failed requests are grouped by query and status, once per page load', async (t) => {
  const { counted } = fakeWindow(t)
  const { countFailedQuery } = await freshAnalytics()

  const throttled = new Error('GBIF request failed (429) for https://api.gbif.org/v1/occurrence/search?classKey=212')
  countFailedQuery('topSpeciesPool', throttled)
  countFailedQuery('topSpeciesPool', throttled)
  countFailedQuery('citySearch', new Error('Nominatim request failed (503)'))
  countFailedQuery('citySearch', new TypeError('Failed to fetch'))
  countFailedQuery('citySearch', new DOMException('Aborted', 'AbortError'))

  assert.deepEqual(counted, ['fail/topSpeciesPool/429', 'fail/citySearch/503', 'fail/citySearch/network'])
})

test('uncaught errors are counted, cancelled requests are not', async (t) => {
  const { counted, listeners } = fakeWindow(t)
  const { countUncaughtErrors } = await freshAnalytics()
  countUncaughtErrors()

  listeners.error({ error: null, message: 'Script error.' })
  listeners.error({ error: new TypeError('x is undefined'), message: 'x is undefined' })
  listeners.unhandledrejection({ reason: new DOMException('Aborted', 'AbortError') })
  listeners.unhandledrejection({ reason: new Error('boom') })

  assert.deepEqual(counted, ['error/TypeError: x is undefined', 'error/Error: boom'])
})

test('first poster time is reported in buckets', async (t) => {
  const { counted } = fakeWindow(t)
  const { countFirstPosterTime } = await freshAnalytics()
  for (const seconds of [1.2, 3.9, 4, 9, 30]) countFirstPosterTime(seconds)
  assert.deepEqual(counted, [
    'perf/first-poster/0-2s',
    'perf/first-poster/2-4s',
    'perf/first-poster/4-8s',
    'perf/first-poster/8-15s',
    'perf/first-poster/15s+',
  ])
})
