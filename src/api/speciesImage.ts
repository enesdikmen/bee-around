/**
 * speciesImage — resolve a representative image for a GBIF species using
 * a configurable chain of sources. Each source can be enabled/disabled
 * independently from the UI; the resolver tries enabled sources in the
 * order they appear in `sources` and returns the first hit.
 *
 * Sources:
 *   - 'wikidata'   : SPARQL P846 (GBIF taxon key) → P18 → Commons thumb.
 *   - 'inaturalist': iNat taxa search → default_photo.medium_url.
 *   - 'gbif'       : /species/{key}/media (first item with url).
 *
 * Results are cached in-memory by speciesKey for the session.
 */
import { fetchSpeciesMedia } from './gbif'

export type ImageSource = 'wikidata' | 'inaturalist' | 'gbif'

export const ALL_IMAGE_SOURCES: ImageSource[] = [
  'wikidata',
  'inaturalist',
  'gbif',
]

export const IMAGE_SOURCE_LABELS: Record<ImageSource, string> = {
  wikidata: 'Wikidata',
  inaturalist: 'iNaturalist',
  gbif: 'GBIF',
}

export interface SpeciesImage {
  /** Best-quality URL for hero/mini tiles (rectangular containers). */
  url: string
  /** Pre-cropped 1:1 thumbnail; falls back to `url` if absent. */
  squareUrl?: string
  source: ImageSource | 'placeholder'
  author?: string
  license?: string
  licenseUrl?: string
  sourceUrl?: string
}

const PLACEHOLDER: SpeciesImage = {
  url: 'https://placehold.co/320x220/f3f4f6/1f2937?text=No+image',
  source: 'placeholder',
}

interface ResolveArgs {
  speciesKey: number
  scientificName?: string
  sources: ImageSource[]
  signal?: AbortSignal
}

/** Fetch JSON, swallowing network/parse errors as null so callers can fall through. */
const safeJson = async <T>(
  url: string,
  signal?: AbortSignal,
  init?: RequestInit,
): Promise<T | null> => {
  try {
    const res = await fetch(url, { ...init, signal })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

const stripHtml = (s?: string) => s?.replace(/<[^>]*>?/gm, '').trim()

// ── Wikidata ──────────────────────────────────────────────────────
// 1) SPARQL P846 (GBIF taxon key) → QID
// 2) Special:EntityData → P18 (image) claim → Commons file name
// 3) Commons API → thumbnail URLs + license metadata

interface SparqlResponse {
  results: { bindings: Array<{ item: { value: string } }> }
}

interface EntityResponse {
  entities: Record<
    string,
    {
      claims?: Record<
        string,
        Array<{ mainsnak: { datavalue?: { value: string } } }>
      >
    }
  >
}

interface CommonsResponse {
  query?: {
    pages?: Record<
      string,
      {
        imageinfo?: Array<{
          url: string
          extmetadata?: Record<string, { value?: string }>
        }>
      }
    >
  }
}

const commonsThumb = (fileName: string, width: number) =>
  `https://commons.wikimedia.org/w/thumb.php?width=${width}&f=${encodeURIComponent(fileName)}`

const tryWikidata = async (
  speciesKey: number,
  signal?: AbortSignal,
): Promise<SpeciesImage | null> => {
  const sparqlQuery = `SELECT ?item WHERE { ?item wdt:P846 "${speciesKey}" . } LIMIT 1`
  const sparql = await safeJson<SparqlResponse>(
    `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparqlQuery)}`,
    signal,
    { headers: { Accept: 'application/sparql-results+json' } },
  )
  const qid = sparql?.results?.bindings?.[0]?.item?.value?.split('/').pop()
  if (!qid) return null

  const entity = await safeJson<EntityResponse>(
    `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`,
    signal,
  )
  const fileName =
    entity?.entities?.[qid]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value
  if (!fileName) return null

  const commons = await safeJson<CommonsResponse>(
    `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(`File:${fileName}`)}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`,
    signal,
  )
  const info = Object.values(commons?.query?.pages ?? {})[0]?.imageinfo?.[0]
  if (!info) return null
  const meta = info.extmetadata ?? {}

  return {
    // Hero tile is 2×2 — 1000px gives object-fit: cover headroom on big screens.
    url: commonsThumb(fileName, 1000),
    squareUrl: commonsThumb(fileName, 400),
    source: 'wikidata',
    author: stripHtml(meta.Artist?.value),
    license: meta.LicenseShortName?.value,
    licenseUrl: meta.LicenseUrl?.value,
    sourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName)}`,
  }
}

// ── iNaturalist ───────────────────────────────────────────────────

interface InatTaxaResponse {
  results: Array<{
    name: string
    default_photo?: {
      medium_url?: string
      url?: string
      square_url?: string
      attribution?: string
      license_code?: string | null
    }
  }>
}

const tryInat = async (
  scientificName: string | undefined,
  signal?: AbortSignal,
): Promise<SpeciesImage | null> => {
  if (!scientificName) return null
  // iNat's `q` is fuzzy and matches common names, so "Lynx lynx" can return
  // "Lynx rufus" (Bobcat). Fetch a handful and require an exact name match.
  const data = await safeJson<InatTaxaResponse>(
    `https://api.inaturalist.org/v1/taxa?per_page=10&rank=species&q=${encodeURIComponent(scientificName)}`,
    signal,
  )
  const target = scientificName.trim().toLowerCase()
  const photo = data?.results?.find(
    (r) => r.name?.trim().toLowerCase() === target,
  )?.default_photo
  const url = photo?.medium_url || photo?.url || photo?.square_url
  if (!url) return null
  return {
    url,
    // Prefer medium-size assets for strip thumbnails too; `square_url` is
    // often too small and looks blurry when cards render larger.
    squareUrl: photo?.medium_url || photo?.url || photo?.square_url,
    source: 'inaturalist',
    author: photo?.attribution,
    license: photo?.license_code || undefined,
  }
}

// ── GBIF ──────────────────────────────────────────────────────────

const tryGbif = async (
  speciesKey: number,
  signal?: AbortSignal,
): Promise<SpeciesImage | null> => {
  try {
    const media = await fetchSpeciesMedia({ speciesKey, limit: 1, signal })
    const item = media.results.find((m) => m.identifier || m.references)
    const url = item?.identifier || item?.references
    if (!url) return null
    return {
      url,
      source: 'gbif',
      author: item?.creator || item?.rightsHolder,
      license: item?.license,
    }
  } catch {
    return null
  }
}

// ── Resolver ──────────────────────────────────────────────────────

const RESOLVERS: Record<
  ImageSource,
  (args: ResolveArgs) => Promise<SpeciesImage | null>
> = {
  wikidata: ({ speciesKey, signal }) => tryWikidata(speciesKey, signal),
  inaturalist: ({ scientificName, signal }) => tryInat(scientificName, signal),
  gbif: ({ speciesKey, signal }) => tryGbif(speciesKey, signal),
}

// Per-source budget. Exceeding it aborts that source and falls through to
// the next. Wikidata gets the tightest budget because WDQS is the most
// common offender; Commons + EntityData are fine but the SPARQL hop is not.
const TIMEOUT_MS: Record<ImageSource, number> = {
  wikidata: 4000,
  inaturalist: 5000,
  gbif: 5000,
}

// When a source returns 429/503/504 or times out, skip it for this long.
const COOLDOWN_MS = 60_000
const cooldownUntil: Record<ImageSource, number> = {
  wikidata: 0,
  inaturalist: 0,
  gbif: 0,
}

// Cap concurrent fetches per source to avoid stampedes when many tiles
// render simultaneously.
const MAX_CONCURRENT = 3
const inflightCount: Record<ImageSource, number> = {
  wikidata: 0,
  inaturalist: 0,
  gbif: 0,
}
const waiters: Record<ImageSource, Array<() => void>> = {
  wikidata: [],
  inaturalist: [],
  gbif: [],
}
const acquire = (source: ImageSource): Promise<void> => {
  if (inflightCount[source] < MAX_CONCURRENT) {
    inflightCount[source]++
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    waiters[source].push(() => {
      inflightCount[source]++
      resolve()
    })
  })
}
const release = (source: ImageSource) => {
  inflightCount[source]--
  const next = waiters[source].shift()
  if (next) next()
}

// One record per speciesKey holds every successfully-resolved source plus
// any in-flight promises. Toggling source preferences just re-reads from
// here; nothing is invalidated.
interface SpeciesImageRecord {
  results: Partial<Record<ImageSource, SpeciesImage>>
  inflight: Partial<Record<ImageSource, Promise<SpeciesImage | null>>>
}
const cache = new Map<number, SpeciesImageRecord>()

const getRecord = (speciesKey: number): SpeciesImageRecord => {
  let rec = cache.get(speciesKey)
  if (!rec) {
    rec = { results: {}, inflight: {} }
    cache.set(speciesKey, rec)
  }
  return rec
}

/** Run a source resolver with timeout, concurrency limit, and cooldown. */
const runSource = (
  source: ImageSource,
  args: ResolveArgs,
): Promise<SpeciesImage | null> => {
  const controller = new AbortController()
  const parent = args.signal
  if (parent) {
    if (parent.aborted) controller.abort()
    else parent.addEventListener('abort', () => controller.abort())
  }
  const timer = setTimeout(() => {
    cooldownUntil[source] = Date.now() + COOLDOWN_MS
    controller.abort()
  }, TIMEOUT_MS[source])

  return acquire(source)
    .then(() => RESOLVERS[source]({ ...args, signal: controller.signal }))
    .catch(() => null)
    .finally(() => {
      clearTimeout(timer)
      release(source)
    })
}

/**
 * Resolve a species image. Cache is keyed by `speciesKey` and stores per-source
 * results, so toggling the active source list is a free re-read for anything
 * already fetched. Sources are tried in `args.sources` order; the first hit
 * wins and later sources are not contacted.
 */
export const resolveSpeciesImage = async (
  args: ResolveArgs,
): Promise<SpeciesImage> => {
  const rec = getRecord(args.speciesKey)

  // 1) Pure cache hit: any preferred source already resolved.
  for (const source of args.sources) {
    const hit = rec.results[source]
    if (hit) return hit
  }

  // 2) Walk the chain, fetching only what's missing and not on cooldown.
  const now = Date.now()
  for (const source of args.sources) {
    if (rec.results[source]) return rec.results[source]!
    if (cooldownUntil[source] > now) continue

    let pending = rec.inflight[source]
    if (!pending) {
      pending = runSource(source, args).then((res) => {
        if (res?.url) rec.results[source] = res
        delete rec.inflight[source]
        return res
      })
      rec.inflight[source] = pending
    }
    const result = await pending
    if (result?.url) return result
    // null → try next source
  }

  // 3) Nothing worked. Don't cache the placeholder so a later toggle that
  // re-enables a previously-down source can try again.
  return PLACEHOLDER
}

export const clearSpeciesImageCache = () => {
  cache.clear()
  cooldownUntil.wikidata = 0
  cooldownUntil.inaturalist = 0
  cooldownUntil.gbif = 0
}
