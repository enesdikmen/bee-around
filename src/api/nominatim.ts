/**
 * Nominatim (OpenStreetMap) city search.
 *
 * Free public endpoint — no API key. Usage policy:
 *   https://operations.osmfoundation.org/policies/nominatim/
 * - max 1 req/sec: the caller debounces, and requests here start at least
 *   1 s apart
 * - cache results: the caller caches (CitySearch uses TanStack Query)
 * - send a Referer (browsers do this automatically)
 * - attribute "© OpenStreetMap contributors" if you display results
 *
 * Returns Place objects carrying the admin bounding box (`bbox`), which the
 * rest of the app uses as the "whole city area" geo filter against GBIF.
 */
import type { Place, PlaceBBox } from '../types/lens'

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
const MIN_REQUEST_INTERVAL_MS = 1000
let lastRequestAt = -Infinity

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('The operation was aborted.', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal?.addEventListener('abort', onAbort, { once: true })
  })

// Only requests that are actually sent count, so a search cancelled by the
// next keystroke does not delay later ones.
const waitForTurn = async (signal?: AbortSignal) => {
  for (;;) {
    if (signal?.aborted) throw new DOMException('The operation was aborted.', 'AbortError')
    const delay = lastRequestAt + MIN_REQUEST_INTERVAL_MS - Date.now()
    if (delay <= 0) break
    await sleep(delay, signal)
  }
  lastRequestAt = Date.now()
}

interface NominatimSearchResult {
  place_id: number
  lat: string
  lon: string
  display_name: string
  name?: string
  type?: string
  class?: string
  boundingbox?: [string, string, string, string] // [south, north, west, east]
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    state?: string
    country?: string
    country_code?: string
  }
}

const normalizeToken = (value?: string) =>
  (value ?? '')
    .trim()
    .toLocaleLowerCase('en')
    .replace(/\s+/g, ' ')

const cityNameFromResult = (r: NominatimSearchResult) => {
  const a = r.address ?? {}
  return (
    a.city ||
    a.town ||
    a.village ||
    a.municipality ||
    r.name ||
    r.display_name.split(',')[0].trim()
  )
}

const countryFromResult = (r: NominatimSearchResult) => {
  const cc = (r.address?.country_code ?? '').toUpperCase()
  return cc || normalizeToken(r.address?.country)
}

const isAdministrativeResult = (r: NominatimSearchResult) =>
  r.class === 'boundary' || r.type === 'administrative'

const dedupeWithAdministrativePreference = (rows: NominatimSearchResult[]) => {
  const bestByKey = new Map<string, NominatimSearchResult>()

  for (const row of rows) {
    const key = `${normalizeToken(cityNameFromResult(row))}__${countryFromResult(row)}`
    const existing = bestByKey.get(key)
    if (!existing) {
      bestByKey.set(key, row)
      continue
    }

    // Keep one option per place label. If we have both "city" and
    // "administrative" variants, prefer administrative to keep area sizing
    // consistent with larger admin units.
    if (isAdministrativeResult(row) && !isAdministrativeResult(existing)) {
      bestByKey.set(key, row)
    }
  }

  return Array.from(bestByKey.values())
}

export interface SearchCitiesOptions {
  signal?: AbortSignal
  limit?: number
  language?: string
}

export async function searchCities(
  query: string,
  { signal, limit = 6, language = 'en' }: SearchCitiesOptions = {},
): Promise<Place[]> {
  const q = query.trim()
  if (q.length < 2) return []

  await waitForTurn(signal)

  const url = new URL(`${NOMINATIM_BASE}/search`)
  url.searchParams.set('format', 'json')
  url.searchParams.set('q', q)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('accept-language', language)
  url.searchParams.set('featuretype', 'city')

  const res = await fetch(url.toString(), {
    signal,
    headers: { 'Accept-Language': language },
  })
  if (!res.ok) throw new Error(`Nominatim request failed (${res.status})`)
  const data = (await res.json()) as NominatimSearchResult[]

  return dedupeWithAdministrativePreference(data).slice(0, limit).map(toPlace)
}

function toPlace(r: NominatimSearchResult): Place {
  const a = r.address ?? {}
  const cityName = cityNameFromResult(r)
  const country = a.country ?? ''
  const cc = (a.country_code ?? '').toUpperCase()
  const label = cc ? `${cityName}, ${cc}` : cityName

  let bbox: PlaceBBox | undefined
  if (r.boundingbox && r.boundingbox.length === 4) {
    const [s, n, w, e] = r.boundingbox.map(parseFloat)
    if ([s, n, w, e].every(Number.isFinite)) {
      bbox = { minLat: s, maxLat: n, minLon: w, maxLon: e }
    }
  }

  return {
    id: `osm-${r.place_id}`,
    label,
    country,
    ...(cc ? { countryCode: cc } : {}),
    latitude: parseFloat(r.lat),
    longitude: parseFloat(r.lon),
    radiusKm: 35,
    bbox,
  }
}
