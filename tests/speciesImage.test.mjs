import assert from 'node:assert/strict'
import { test } from 'node:test'
import { moduleLoader, response } from './helpers.mjs'

const freshImages = await moduleLoader('src/api/speciesImage.ts')
const sources = ['inaturalist', 'wikidata', 'gbif']

const photo = (id) => ({ id, medium_url: `https://static.inaturalist.org/photos/${id}/medium.jpg`, square_url: `https://static.inaturalist.org/photos/${id}/square.jpg` })

// Answers every source; `inat` decides what iNaturalist returns for a query.
function mockSources(t, inat) {
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url) => {
    const u = new URL(url)
    calls.push(u.host)
    if (u.host === 'api.inaturalist.org') return inat(u.searchParams.get('q'))
    if (u.host === 'query.wikidata.org') return response(200, { results: { bindings: [] } })
    if (u.pathname.includes('/media')) return response(200, { offset: 0, limit: 1, endOfRecords: true, results: [] })
    throw new Error(`unexpected ${url}`)
  })
  return calls
}

test('a species with no photo anywhere is looked up once, then answered from the cache', async (t) => {
  const { resolveSpeciesImage } = await freshImages()
  const calls = mockSources(t, () => response(200, { results: [] }))
  assert.equal(await resolveSpeciesImage({ speciesKey: 1, scientificName: 'Umbelopsis gibberispora', sources }), null)
  assert.deepEqual(calls, ['api.inaturalist.org', 'query.wikidata.org', 'api.gbif.org'])
  assert.equal(await resolveSpeciesImage({ speciesKey: 1, scientificName: 'Umbelopsis gibberispora', sources }), null)
  assert.equal(calls.length, 3, 'no new requests')
})

test('failed lookups are retried on the next pass', async (t) => {
  const { resolveSpeciesImage } = await freshImages()
  let attempt = 0
  const calls = mockSources(t, () => {
    attempt++
    if (attempt === 1) return response(503)
    if (attempt === 2) throw new TypeError('Failed to fetch')
    return response(200, { results: [{ name: 'Milvus migrans', default_photo: photo(7) }] })
  })
  const args = { speciesKey: 2, scientificName: 'Milvus migrans', sources }
  assert.equal(await resolveSpeciesImage(args), null)
  assert.equal(await resolveSpeciesImage(args), null)
  const found = await resolveSpeciesImage(args)
  assert.equal(found.source, 'inaturalist')
  assert.equal(calls.filter((h) => h === 'api.inaturalist.org').length, 3)
  // The definite "no photo" answers from Wikidata and GBIF were not repeated.
  assert.equal(calls.filter((h) => h === 'query.wikidata.org').length, 1)
  await resolveSpeciesImage(args)
  assert.equal(calls.filter((h) => h === 'api.inaturalist.org').length, 3, 'a found photo is cached')
})

test('a renamed species is found through its matched term; an exact name still wins', async (t) => {
  const { resolveSpeciesImage } = await freshImages()
  mockSources(t, (q) =>
    q === 'Aquila pomarina'
      ? response(200, { results: [{ name: 'Clanga pomarina', matched_term: 'Aquila pomarina', default_photo: photo(1) }] })
      : response(200, {
          results: [
            { name: 'Lynx rufus', matched_term: 'Lynx lynx', default_photo: photo(2) },
            { name: 'Lynx lynx', matched_term: 'Lynx lynx', default_photo: photo(3) },
          ],
        }),
  )
  const eagle = await resolveSpeciesImage({ speciesKey: 3, scientificName: 'Aquila pomarina', sources })
  assert.match(eagle.url, /photos\/1\//)
  const lynx = await resolveSpeciesImage({ speciesKey: 4, scientificName: 'Lynx lynx', sources })
  assert.match(lynx.url, /photos\/3\//)
})
