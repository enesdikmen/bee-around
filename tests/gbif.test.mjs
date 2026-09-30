import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

// Compile the self-contained API module with the project's existing compiler.
// A fresh module per test isolates its caches and scheduler without test-only
// exports, new dependencies, or calls to the real GBIF service.
const source = await readFile(new URL('../src/api/gbif.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
let moduleId = 0
const freshApi = () => import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}#${moduleId++}`)

function virtualClock(t) {
  let now = 0
  let timerId = 0
  const timers = new Map()
  t.mock.method(Date, 'now', () => now)
  t.mock.method(Math, 'random', () => 0)
  t.mock.method(globalThis, 'setTimeout', (fn, delay = 0) => {
    const id = ++timerId
    timers.set(id, { fn, at: now + delay })
    return id
  })
  t.mock.method(globalThis, 'clearTimeout', (id) => timers.delete(id))
  const flush = async () => {
    for (let i = 0; i < 30; i++) await Promise.resolve()
  }
  return {
    now: () => now,
    flush,
    async advance(ms) {
      const target = now + ms
      await flush()
      for (;;) {
        const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0]
        if (!next || next[1].at > target) break
        now = next[1].at
        timers.delete(next[0])
        next[1].fn()
        await flush()
      }
      now = target
      await flush()
    },
  }
}

const response = (status, data = {}, retryAfter) => ({
  status,
  ok: status >= 200 && status < 300,
  headers: new Headers(retryAfter === undefined ? {} : { 'Retry-After': retryAfter }),
  json: async () => structuredClone(data),
})
const facetRequest = {
  latitude: 48.1372,
  longitude: 11.5761,
  bbox: { minLat: 48.0616, maxLat: 48.2481, minLon: 11.3608, maxLon: 11.7229 },
  countryCode: 'DE',
  facetFields: ['speciesKey'],
  facetLimit: 3,
  classKey: 359,
}
const facetData = {
  count: 100,
  offset: 0,
  limit: 0,
  endOfRecords: true,
  results: [],
  // Deliberately tied counts in this order: transport must never sort, trim,
  // merge, or substitute candidate pools used by seeded poster selection.
  facets: [{ field: 'SPECIES_KEY', counts: [
    { name: '3', count: 40 }, { name: '1', count: 40 }, { name: '2', count: 20 },
  ] }],
}

test('shared occurrence requests keep exact query, payload order and cached result after 429', async (t) => {
  const api = await freshApi()
  const clock = virtualClock(t)
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url) => {
    calls.push(url)
    return calls.length === 1 ? response(429, {}, '1') : response(200, facetData)
  })
  // Current poster and lock restore can request the same pool simultaneously.
  const first = api.fetchOccurrenceFacets(facetRequest)
  const restore = api.fetchOccurrenceFacets(facetRequest)
  await clock.advance(1000)
  assert.deepEqual(await first, facetData)
  assert.deepEqual(await restore, facetData)
  assert.deepEqual(await api.fetchOccurrenceFacets(facetRequest), facetData)
  assert.equal(calls.length, 2)
  assert.equal(calls[0], calls[1])
  assert.equal(calls[0], 'https://api.gbif.org/v1/occurrence/search?limit=0&decimalLatitude=48.0616%2C48.2481&decimalLongitude=11.3608%2C11.7229&classKey=359&facet=speciesKey&facetLimit=3')
})

test('per-facet limits are sent as <field>.facetLimit and identical requests share one call', async (t) => {
  const api = await freshApi()
  const clock = virtualClock(t)
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url) => {
    calls.push(url)
    return response(200, facetData)
  })
  // The place summary and signature species hooks build the same request.
  const summary = { ...facetRequest, classKey: undefined, facetFields: ['month', 'speciesKey'], facetLimit: 300, facetLimits: { speciesKey: 500 } }
  const both = [api.fetchOccurrenceFacets(summary), api.fetchOccurrenceFacets({ ...summary })]
  await clock.advance(100)
  await Promise.all(both)
  assert.equal(calls.length, 1)
  const params = new URL(calls[0]).searchParams
  assert.deepEqual(params.getAll('facet'), ['month', 'speciesKey'])
  assert.equal(params.get('facetLimit'), '300')
  assert.equal(params.get('speciesKey.facetLimit'), '500')
})

test('healthy metadata stays parallel and never exceeds six active requests', async (t) => {
  const api = await freshApi()
  const clock = virtualClock(t)
  const calls = []
  const release = []
  let active = 0
  let peak = 0
  t.mock.method(globalThis, 'fetch', (url) => new Promise((resolve) => {
    active++
    peak = Math.max(peak, active)
    calls.push({ url, at: clock.now() })
    release.push(() => { active--; resolve(response(200, { key: Number(url.split('/').pop()) })) })
  }))
  const pending = Array.from({ length: 9 }, (_, speciesKey) => api.fetchSpecies({ speciesKey }))
  await clock.advance(2000)
  assert.equal(calls.length, 6)
  assert.deepEqual(calls.map((c) => c.at), [0, 0, 0, 0, 0, 0])
  release.splice(0).forEach((finish) => finish())
  await clock.advance(500)
  assert.deepEqual(calls.slice(6).map((c) => c.at), [2000, 2000, 2000])
  release.splice(0).forEach((finish) => finish())
  await clock.flush()
  assert.equal((await Promise.all(pending)).length, 9)
  assert.equal(peak, 6)
})

test('searches are paced with three active at most; metadata uses spare capacity immediately', async (t) => {
  const api = await freshApi()
  const clock = virtualClock(t)
  const calls = []
  const release = []
  t.mock.method(globalThis, 'fetch', (url) => new Promise((resolve) => {
    calls.push({ url, at: clock.now() })
    release.push(() => resolve(response(200, facetData)))
  }))
  const searches = [1, 2, 3, 4].map((classKey) => api.fetchOccurrenceFacets({ ...facetRequest, classKey }))
  await clock.advance(500)
  assert.deepEqual(calls.map((c) => c.at), [0, 100, 200])
  const metadata = [1, 2, 3].map((speciesKey) => api.fetchSpecies({ speciesKey }))
  await clock.flush()
  assert.equal(calls.length, 6)
  assert.ok(calls.slice(3).every((c) => c.at === 500 && c.url.includes('/species/')))
  release.splice(0).forEach((finish) => finish())
  await clock.advance(500)
  assert.equal(calls.length, 7)
  release.splice(0).forEach((finish) => finish())
  await Promise.all([...searches, ...metadata])
})

test('low-priority searches keep the pace but start after queued normal searches', async (t) => {
  const api = await freshApi()
  const clock = virtualClock(t)
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url) => {
    calls.push({ key: new URL(url).searchParams.get('classKey'), at: clock.now() })
    return response(200, facetData)
  })
  const low = [1, 2].map((classKey) => api.fetchOccurrenceFacets({ ...facetRequest, classKey, queuePriority: 'low' }))
  const normal = [3, 4, 5].map((classKey) => api.fetchOccurrenceFacets({ ...facetRequest, classKey }))
  await clock.advance(1000)
  await Promise.all([...low, ...normal])
  // The first low request started before the normal ones were queued.
  assert.deepEqual(calls.map((c) => c.key), ['1', '3', '4', '5', '2'])
  assert.deepEqual(calls.map((c) => c.at), [0, 100, 200, 300, 400])
})

test('429 cooldown applies to queued work and retries; later Retry-After extends it', async (t) => {
  const api = await freshApi()
  const clock = virtualClock(t)
  const calls = []
  const release = []
  t.mock.method(globalThis, 'fetch', (url) => {
    calls.push({ url, at: clock.now() })
    if (calls.length <= 2) return new Promise((resolve) => release.push(resolve))
    return Promise.resolve(response(200, { key: Number(new URL(url).searchParams.get('classKey')) }))
  })
  const pending = [1, 2, 3, 4].map((classKey) => api.fetchOccurrenceFacets({ ...facetRequest, classKey }))
  await clock.advance(100)
  release[0](response(429, {}, '2'))
  await clock.advance(50)
  release[1](response(429, {}, '5'))
  await clock.advance(4999)
  assert.equal(calls.length, 2, 'no new requests during the shared cooldown')
  await clock.advance(1001)
  assert.equal(calls.length, 6)
  assert.equal(calls[2].at, 5150)
  for (let i = 3; i < calls.length; i++) assert.ok(calls[i].at - calls[i - 1].at >= 200)
  assert.deepEqual((await Promise.all(pending)).map((item) => item.key), [1, 2, 3, 4])
})

test('HTTP-date Retry-After is honored and paced requests recover after successes', async (t) => {
  const api = await freshApi()
  const clock = virtualClock(t)
  const starts = []
  t.mock.method(globalThis, 'fetch', async () => {
    starts.push(clock.now())
    return starts.length === 1
      ? response(429, {}, new Date(3000).toUTCString())
      : response(200, { key: 1 })
  })
  const pending = Array.from({ length: 30 }, (_, classKey) => api.fetchOccurrenceFacets({ ...facetRequest, classKey }))
  await clock.advance(2999)
  assert.equal(starts.length, 1)
  await clock.advance(10001)
  await Promise.all(pending)
  assert.equal(starts[1], 3000)
  const gaps = starts.slice(2).map((at, i) => at - starts[i + 1])
  // The 429 doubles the spacing. Every 6 successes then shorten it by 20%.
  assert.deepEqual(gaps.slice(0, 13), [200, 200, 200, 200, 200, 200, 160, 160, 160, 160, 160, 160, 128])
  assert.equal(gaps.at(-1), 100, 'successful traffic recovers its initial pace')
})

test('a search 429 pauses metadata too, then healthy metadata resumes without search pacing', async (t) => {
  const api = await freshApi()
  const clock = virtualClock(t)
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url) => {
    calls.push({ url, at: clock.now() })
    return calls.length === 1 ? response(429, {}, '2') : response(200, facetData)
  })
  const search = api.fetchOccurrenceFacets(facetRequest)
  await clock.flush()
  const metadata = [1, 2, 3].map((speciesKey) => api.fetchSpecies({ speciesKey }))
  await clock.advance(1999)
  assert.equal(calls.length, 1)
  await clock.advance(1)
  assert.equal(calls.length, 5)
  assert.ok(calls.slice(1).every((c) => c.at === 2000))
  await Promise.all([search, ...metadata])
})

test('persistent throttling has bounded exponential retries and failed responses are not cached', async (t) => {
  const api = await freshApi()
  const clock = virtualClock(t)
  const starts = []
  t.mock.method(globalThis, 'fetch', async () => {
    starts.push(clock.now())
    return starts.length <= 4 ? response(429) : response(200, facetData)
  })
  const rejected = assert.rejects(api.fetchOccurrenceFacets(facetRequest), /GBIF request failed \(429\)/)
  await clock.advance(7000)
  await rejected
  assert.deepEqual(starts, [0, 1000, 3000, 7000])
  const retry = api.fetchOccurrenceFacets(facetRequest)
  await clock.advance(7999)
  assert.equal(starts.length, 4, 'even the last 429 protects the queue from immediate replay')
  await clock.advance(1)
  assert.deepEqual(await retry, facetData)
})

test('cancelling one shared caller does not cancel the pool needed by URL lock restoration', async (t) => {
  const api = await freshApi()
  const clock = virtualClock(t)
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => {
    calls++
    return calls === 1 ? response(429, {}, '1') : response(200, facetData)
  })
  const ctrl = new AbortController()
  const cancelled = assert.rejects(api.fetchOccurrenceFacets({ ...facetRequest, signal: ctrl.signal }), { name: 'AbortError' })
  const restore = api.fetchOccurrenceFacets(facetRequest)
  await clock.flush()
  ctrl.abort()
  await cancelled
  await clock.advance(1000)
  assert.deepEqual(await restore, facetData)
  assert.equal(calls, 2)
})

test('cancelled queued media requests are removed without blocking the next request', async (t) => {
  const api = await freshApi()
  const clock = virtualClock(t)
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url) => {
    calls.push(url)
    return calls.length === 1 ? response(429, {}, '2') : response(200, { results: [] })
  })
  const first = api.fetchSpeciesMedia({ speciesKey: 1 })
  await clock.flush()
  const ctrl = new AbortController()
  const cancelled = assert.rejects(api.fetchSpeciesMedia({ speciesKey: 2, signal: ctrl.signal }), { name: 'AbortError' })
  const next = api.fetchSpeciesMedia({ speciesKey: 3 })
  ctrl.abort()
  await cancelled
  await clock.advance(2500)
  await Promise.all([first, next])
  assert.equal(calls.length, 3)
  assert.ok(calls.every((url) => !url.includes('/species/2/')))
})

test('language-specific metadata stays separate and non-429 failures are not retried', async (t) => {
  const api = await freshApi()
  const clock = virtualClock(t)
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    const language = new Headers(init.headers).get('Accept-Language')
    calls.push({ url, language })
    return language === 'de' ? response(400) : response(200, { key: 1, vernacularName: language })
  })
  const english = api.fetchSpecies({ speciesKey: 1, language: 'en' })
  const german = assert.rejects(api.fetchSpecies({ speciesKey: 1, language: 'de' }), /\(400\)/)
  await clock.advance(1000)
  assert.equal((await english).vernacularName, 'en')
  await german
  assert.equal(calls.length, 2)
  assert.equal((await api.fetchSpecies({ speciesKey: 1, language: 'en' })).vernacularName, 'en')
  assert.equal(calls.length, 2)
})
