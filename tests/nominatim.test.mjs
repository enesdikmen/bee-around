import assert from 'node:assert/strict'
import { test } from 'node:test'
import { moduleLoader, response, virtualClock } from './helpers.mjs'

const freshSearch = await moduleLoader('src/api/nominatim.ts')

const munich = {
  place_id: 1,
  lat: '48.1371',
  lon: '11.5754',
  display_name: 'München, Bayern, Deutschland',
  class: 'boundary',
  type: 'administrative',
  boundingbox: ['48.0616', '48.2481', '11.3608', '11.7229'],
  address: { city: 'München', country: 'Deutschland', country_code: 'de' },
}

function mockNominatim(t, clock) {
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url) => {
    calls.push({ q: new URL(url).searchParams.get('q'), at: clock.now() })
    return response(200, [munich])
  })
  return calls
}

test('requests start at least 1 s apart', async (t) => {
  const { searchCities } = await freshSearch()
  const clock = virtualClock(t)
  const calls = mockNominatim(t, clock)

  const [place] = await searchCities('Munich')
  assert.equal(place.label, 'München, DE')
  assert.deepEqual(place.bbox, { minLat: 48.0616, maxLat: 48.2481, minLon: 11.3608, maxLon: 11.7229 })

  const next = searchCities('Munic')
  await clock.advance(999)
  assert.equal(calls.length, 1, 'the policy allows at most one request per second')
  await clock.advance(1)
  await next
  assert.deepEqual(calls.map((c) => c.at), [0, 1000])
})

test('a search cancelled by the next keystroke does not delay later searches', async (t) => {
  const { searchCities } = await freshSearch()
  const clock = virtualClock(t)
  const calls = mockNominatim(t, clock)

  await searchCities('Mu')
  await clock.advance(200)
  const ctrl = new AbortController()
  const cancelled = assert.rejects(searchCities('Mun', { signal: ctrl.signal }), { name: 'AbortError' })
  await clock.advance(300)
  ctrl.abort()
  await cancelled
  const latest = searchCities('Muni')
  await clock.advance(500)
  await latest
  assert.deepEqual(calls.map((c) => [c.q, c.at]), [['Mu', 0], ['Muni', 1000]])
})
