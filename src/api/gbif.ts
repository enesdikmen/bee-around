const GBIF_BASE_URL = 'https://api.gbif.org/v1'
const GBIF_MAX_CONCURRENT_REQUESTS = 6
const GBIF_MAX_429_RETRIES = 3
const GBIF_RETRY_BACKOFF_MS = 1000
// A concurrency cap alone still allows bursts when responses arrive quickly.
// This is a starting pace, not a guaranteed GBIF allowance (limits vary with load).
const GBIF_SEARCH_START_INTERVAL_MS = 100
const GBIF_MAX_START_INTERVAL_MS = 1000
const GBIF_RECOVERY_SUCCESSES = 6

type GbifLane = {
	maxConcurrent: number
	inFlight: number
	nextStartAt: number
	baseIntervalMs: number
	startIntervalMs: number
	throttledUntil: number
	successesSinceThrottle: number
}

const createLane = (maxConcurrent: number, baseIntervalMs: number): GbifLane => ({
	maxConcurrent,
	inFlight: 0,
	nextStartAt: 0,
	baseIntervalMs,
	startIntervalMs: baseIntervalMs,
	throttledUntil: 0,
	successesSinceThrottle: 0,
})

// GBIF's expensive occurrence searches need pacing. Metadata may use spare
// capacity immediately, so fetching names does not wait behind a search timer.
const gbifSearchLane = createLane(3, GBIF_SEARCH_START_INTERVAL_MS)
const gbifMetadataLane = createLane(GBIF_MAX_CONCURRENT_REQUESTS, 0)
let gbifInFlight = 0
type GbifQueueEntry = { lane: GbifLane; priority: QueuePriority; start: () => void }
const gbifQueue: GbifQueueEntry[] = []
let gbifQueueTimer: ReturnType<typeof setTimeout> | undefined
let gbifCooldownUntil = 0

const createAbortError = () =>
	new DOMException('The operation was aborted.', 'AbortError')

const parseRetryAfterMs = (value: string | null) => {
	if (!value) return null

	const asSeconds = Number(value)
	if (Number.isFinite(asSeconds)) return Math.max(0, asSeconds * 1000)

	const asDate = Date.parse(value)
	if (Number.isFinite(asDate)) return Math.max(0, asDate - Date.now())

	return null
}

const drainGbifQueue = () => {
	if (gbifQueueTimer !== undefined) {
		clearTimeout(gbifQueueTimer)
		gbifQueueTimer = undefined
	}
	if (!gbifQueue.length || gbifInFlight >= GBIF_MAX_CONCURRENT_REQUESTS) return

	const now = Date.now()
	const available = gbifQueue.filter(({ lane }) => lane.inFlight < lane.maxConcurrent)
	if (!available.length) return // A completing request will wake the queue.
	const nextStartAt = Math.min(...available.map(({ lane }) => lane.nextStartAt))
	const delay = Math.max(nextStartAt, gbifCooldownUntil) - now
	if (delay > 0) {
		// Clamp only the timer, not the cooldown: large Retry-After values must
		// not overflow setTimeout and accidentally cause an immediate retry.
		gbifQueueTimer = setTimeout(drainGbifQueue, Math.min(delay, 2 ** 31 - 1))
		return
	}

	// FIFO, except that low-priority work waits while normal work is ready.
	const ready = ({ lane }: GbifQueueEntry) =>
		lane.inFlight < lane.maxConcurrent && lane.nextStartAt <= now
	let index = gbifQueue.findIndex((entry) => ready(entry) && entry.priority === 'normal')
	if (index < 0) index = gbifQueue.findIndex(ready)
	const { lane, start } = gbifQueue.splice(index, 1)[0]
	gbifInFlight += 1
	lane.inFlight += 1
	lane.nextStartAt = now + lane.startIntervalMs
	start()
	drainGbifQueue()
}

const throttleGbifQueue = (lane: GbifLane, retryAfter: string | null, attempt: number) => {
	const now = Date.now()
	// Multiple in-flight requests can be rejected in one wave. Slow the
	// affected lane once per wave, while honoring every cooldown deadline.
	if (now >= lane.throttledUntil) {
		lane.startIntervalMs = Math.min(
			Math.max(lane.startIntervalMs * 2, GBIF_SEARCH_START_INTERVAL_MS),
			GBIF_MAX_START_INTERVAL_MS,
		)
	}
	lane.successesSinceThrottle = 0
	const delay = parseRetryAfterMs(retryAfter) ?? GBIF_RETRY_BACKOFF_MS * 2 ** attempt
	const jitter = Math.floor(Math.random() * 250)
	gbifCooldownUntil = Math.max(gbifCooldownUntil, now + Math.max(250, delay) + jitter)
	lane.throttledUntil = gbifCooldownUntil
	drainGbifQueue()
}

const recordGbifSuccess = (lane: GbifLane) => {
	// Responses from before the throttle must not immediately undo it.
	if (Date.now() < gbifCooldownUntil || lane.startIntervalMs === lane.baseIntervalMs) return
	lane.successesSinceThrottle += 1
	if (lane.successesSinceThrottle >= GBIF_RECOVERY_SUCCESSES) {
		lane.startIntervalMs = Math.max(lane.baseIntervalMs, Math.floor(lane.startIntervalMs * 0.8))
		lane.successesSinceThrottle = 0
	}
}

const acquireGbifSlot = async (
	lane: GbifLane,
	priority: QueuePriority,
	signal?: AbortSignal,
) => {
	if (signal?.aborted) throw createAbortError()

	await new Promise<void>((resolve, reject) => {
		const start = () => {
			signal?.removeEventListener('abort', onAbort)
			resolve()
		}
		const entry = { lane, priority, start }

		const onAbort = () => {
			const idx = gbifQueue.indexOf(entry)
			if (idx >= 0) gbifQueue.splice(idx, 1)
			signal?.removeEventListener('abort', onAbort)
			reject(createAbortError())
			drainGbifQueue()
		}

		gbifQueue.push(entry)
		signal?.addEventListener('abort', onAbort, { once: true })
		drainGbifQueue()
	})
}

const releaseGbifSlot = (lane: GbifLane) => {
	gbifInFlight = Math.max(0, gbifInFlight - 1)
	lane.inFlight = Math.max(0, lane.inFlight - 1)
	drainGbifQueue()
}

// Metadata endpoints are highly reusable across lenses. Keep a small in-memory
// cache and in-flight registry so concurrent hooks share one network request.
const speciesCache = new Map<string, GbifSpecies>()
const speciesInFlight = new Map<string, Promise<GbifSpecies>>()

const datasetCache = new Map<string, GbifDataset>()
const datasetInFlight = new Map<string, Promise<GbifDataset>>()

const OCCURRENCE_FACET_CACHE_TTL_MS = 1000 * 60 * 30
const occurrenceFacetCache = new Map<
	string,
	{ data: OccurrenceFacetResponse; expiresAt: number }
>()
const occurrenceFacetInFlight = new Map<string, Promise<OccurrenceFacetResponse>>()

const raceWithSignal = <T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> => {
	if (!signal) return promise
	if (signal.aborted) return Promise.reject(createAbortError())

	return new Promise<T>((resolve, reject) => {
		const onAbort = () => {
			signal.removeEventListener('abort', onAbort)
			reject(createAbortError())
		}

		signal.addEventListener('abort', onAbort, { once: true })
		promise.then(
			(value) => {
				signal.removeEventListener('abort', onAbort)
				resolve(value)
			},
			(error) => {
				signal.removeEventListener('abort', onAbort)
				reject(error)
			},
		)
	})
}

export type FacetField =
	| 'month'
	| 'year'
	| 'speciesKey'
	| 'kingdomKey'
	| 'classKey'
	| 'datasetKey'
	| 'country'
	| 'basisOfRecord'
	| 'mediaType'
	| 'iucnRedListCategory'

export interface OccurrenceFacetCount {
	name: string
	count: number
}

export interface OccurrenceFacet {
	field: string
	counts: OccurrenceFacetCount[]
}

export interface OccurrenceFacetResponse {
	count: number
	offset: number
	limit: number
	endOfRecords: boolean
	results: []
	facets: OccurrenceFacet[]
}

export interface GbifSpecies {
	key: number
	scientificName: string
	canonicalName?: string
	vernacularName?: string
	rank?: string
	kingdomKey?: number
	classKey?: number
	orderKey?: number
	familyKey?: number
	kingdom?: string
	phylum?: string
	class?: string
	order?: string
	family?: string
	genus?: string
	species?: string
}

export interface GbifMediaItem {
	identifier?: string
	references?: string
	title?: string
	type?: string
	license?: string
	rightsHolder?: string
	creator?: string
}

export interface GbifMediaResponse {
	offset: number
	limit: number
	endOfRecords: boolean
	results: GbifMediaItem[]
}

export interface GbifDataset {
	key: string
	title: string
	doi?: string
	description?: string
	publisher?: string
	license?: string
	citation?: {
		text?: string
	}
}

/**
 * `low` is for requests the poster does not wait on (the red-list species
 * counts). They keep the same pace but start after queued normal requests,
 * so requests that lead to species names and images finish sooner.
 */
export type QueuePriority = 'normal' | 'low'

interface RequestOptions {
	signal?: AbortSignal
	headers?: HeadersInit
	queuePriority?: QueuePriority
}

export interface OccurrenceFacetRequest extends RequestOptions {
	latitude: number
	longitude: number
	radiusKm?: number
	/** Real bounding box (preferred over radiusKm when set). */
	bbox?: { minLat: number; maxLat: number; minLon: number; maxLon: number }
	/** ISO-2 country code for country-scale searches. */
	countryCode?: string
	facetFields: FacetField[]
	facetLimit?: number
	/** Per-field overrides of `facetLimit`, sent as `<field>.facetLimit`. */
	facetLimits?: Partial<Record<FacetField, number>>
	facetOffset?: number
	classKey?: number | number[]
	kingdomKey?: number | number[]
	orderKey?: number | number[]
	familyKey?: number | number[]
	speciesKey?: number | number[]
	mediaType?: string | string[]
	iucnRedListCategory?: string | string[]
	month?: number | number[]
	year?: number | number[] | string
}

export interface SpeciesRequest extends RequestOptions {
	speciesKey: number
	language?: string
}

export interface SpeciesMediaRequest extends RequestOptions {
	speciesKey: number
	limit?: number
	offset?: number
}

export interface DatasetRequest extends RequestOptions {
	datasetKey: string
}

// GBIF occurrence search supports bounding boxes; approximate a radius with lat/lon deltas.
const toBounds = (latitude: number, longitude: number, radiusKm: number) => {
	const kmPerDegLat = 110.574
	const kmPerDegLon = 111.32 * Math.cos((latitude * Math.PI) / 180)

	const latDelta = radiusKm / kmPerDegLat
	const lonDelta = radiusKm / kmPerDegLon

	const minLat = Math.max(-90, latitude - latDelta)
	const maxLat = Math.min(90, latitude + latDelta)
	const minLon = Math.max(-180, longitude - lonDelta)
	const maxLon = Math.min(180, longitude + lonDelta)

	return { minLat, maxLat, minLon, maxLon }
}

const buildUrl = (
	endpoint: string,
	params: Record<string, string | number | Array<string | number> | undefined>,
) => {
	const url = new URL(`${GBIF_BASE_URL}${endpoint}`)

	Object.entries(params).forEach(([key, value]) => {
		if (value === undefined) return
		if (Array.isArray(value)) {
			value.forEach((item) => url.searchParams.append(key, String(item)))
			return
		}
		url.searchParams.set(key, String(value))
	})

	return url.toString()
}

const normalizeLanguage = (language?: string) =>
	(language ?? '').trim().toLowerCase()

const normalizeCountryCode = (countryCode?: string) => {
	const cc = (countryCode ?? '').trim().toUpperCase()
	return /^[A-Z]{2}$/.test(cc) ? cc : null
}

const isCountryScaleBBox = (
	bbox: { minLat: number; maxLat: number; minLon: number; maxLon: number } | undefined,
) => {
	if (!bbox) return false
	const latSpan = Math.abs(bbox.maxLat - bbox.minLat)
	const lonSpan = Math.abs(bbox.maxLon - bbox.minLon)
	return latSpan >= 20 || lonSpan >= 40
}

// Centralized JSON fetch so we keep error messages consistent for UI + debugging.
const fetchJson = async <T>(url: string, options: RequestOptions = {}) => {
	const lane = url.startsWith(`${GBIF_BASE_URL}/occurrence/search?`)
		? gbifSearchLane
		: gbifMetadataLane
	for (let attempt = 0; attempt <= GBIF_MAX_429_RETRIES; attempt++) {
		// Every attempt uses the same queue, including retries. A 429 pauses
		// all new GBIF traffic in this tab, instead of just its own request.
		await acquireGbifSlot(lane, options.queuePriority ?? 'normal', options.signal)
		try {
			if (options.signal?.aborted) throw createAbortError()

			const response = await fetch(url, {
				signal: options.signal,
				headers: options.headers,
			})

			if (response.ok) {
				const data = (await response.json()) as T
				recordGbifSuccess(lane)
				return data
			}

			if (response.status === 429) {
				throttleGbifQueue(lane, response.headers.get('Retry-After'), attempt)
				if (attempt < GBIF_MAX_429_RETRIES) continue
			}

			throw new Error(`GBIF request failed (${response.status}) for ${url}`)
		} finally {
			releaseGbifSlot(lane)
		}
	}

	throw new Error(`GBIF request failed (429) for ${url}`)
}

export const fetchOccurrenceFacets = async ({
	latitude,
	longitude,
	radiusKm = 35,
	bbox,
	countryCode,
	facetFields,
	facetLimit = 10,
	facetLimits,
	facetOffset,
	classKey,
	kingdomKey,
	orderKey,
	familyKey,
	speciesKey,
	mediaType,
	iucnRedListCategory,
	month,
	year,
	signal,
	queuePriority,
}: OccurrenceFacetRequest) => {
	const normalizedCountryCode = normalizeCountryCode(countryCode)
	const useCountryFilter = Boolean(normalizedCountryCode && isCountryScaleBBox(bbox))

	// Geometry: prefer the real bbox from Nominatim, else fall back to a
	// bbox derived from radiusKm.
	const b = bbox ?? toBounds(latitude, longitude, radiusKm)

	const url = buildUrl('/occurrence/search', {
		limit: 0,
		// Using facets with limit=0 keeps payloads small while still returning summary counts.
		decimalLatitude: useCountryFilter ? undefined : `${b.minLat},${b.maxLat}`,
		decimalLongitude: useCountryFilter ? undefined : `${b.minLon},${b.maxLon}`,
		country: useCountryFilter ? normalizedCountryCode ?? undefined : undefined,
		classKey,
		kingdomKey,
		orderKey,
		familyKey,
		speciesKey,
		mediaType,
		iucnRedListCategory,
		month,
		year,
		facet: facetFields,
		facetLimit,
		...Object.fromEntries(
			Object.entries(facetLimits ?? {}).map(([field, limit]) => [`${field}.facetLimit`, limit]),
		),
		facetOffset,
	})

	const now = Date.now()
	const cached = occurrenceFacetCache.get(url)
	if (cached && cached.expiresAt > now) {
		return raceWithSignal(Promise.resolve(cached.data), signal)
	}
	if (cached) occurrenceFacetCache.delete(url)

	const existing = occurrenceFacetInFlight.get(url)
	if (existing) return raceWithSignal(existing, signal)

	const request = fetchJson<OccurrenceFacetResponse>(url, { queuePriority })
		.then((result) => {
			occurrenceFacetCache.set(url, {
				data: result,
				expiresAt: Date.now() + OCCURRENCE_FACET_CACHE_TTL_MS,
			})
			return result
		})
		.finally(() => {
			occurrenceFacetInFlight.delete(url)
		})

	occurrenceFacetInFlight.set(url, request)
	return raceWithSignal(request, signal)
}

export const fetchSpecies = async ({ speciesKey, signal, language }: SpeciesRequest) => {
	const normalizedLanguage = normalizeLanguage(language)
	const cacheKey = `${speciesKey}:${normalizedLanguage || 'default'}`
	const cached = speciesCache.get(cacheKey)
	if (cached) return raceWithSignal(Promise.resolve(cached), signal)

	const existing = speciesInFlight.get(cacheKey)
	if (existing) return raceWithSignal(existing, signal)

	const url = buildUrl(`/species/${speciesKey}`, {})
	const request = fetchJson<GbifSpecies>(url, {
		headers: normalizedLanguage
			? { 'Accept-Language': normalizedLanguage }
			: undefined,
	})
		.then((result) => {
			speciesCache.set(cacheKey, result)
			return result
		})
		.finally(() => {
			speciesInFlight.delete(cacheKey)
		})

	speciesInFlight.set(cacheKey, request)
	return raceWithSignal(request, signal)
}

export const fetchSpeciesMedia = async ({
	speciesKey,
	limit = 8,
	offset = 0,
	signal,
}: SpeciesMediaRequest) => {
	const url = buildUrl(`/species/${speciesKey}/media`, { limit, offset })
	return fetchJson<GbifMediaResponse>(url, { signal })
}

export const fetchDatasetMetadata = async ({
	datasetKey,
	signal,
}: DatasetRequest) => {
	const cached = datasetCache.get(datasetKey)
	if (cached) return raceWithSignal(Promise.resolve(cached), signal)

	const existing = datasetInFlight.get(datasetKey)
	if (existing) return raceWithSignal(existing, signal)

	const url = buildUrl(`/dataset/${datasetKey}`, {})
	const request = fetchJson<GbifDataset>(url)
		.then((result) => {
			datasetCache.set(datasetKey, result)
			return result
		})
		.finally(() => {
			datasetInFlight.delete(datasetKey)
		})

	datasetInFlight.set(datasetKey, request)
	return raceWithSignal(request, signal)
}

export { GBIF_BASE_URL }
