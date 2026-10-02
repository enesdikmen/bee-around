// GoatCounter is loaded from index.html. It is absent in local dev, in builds
// published before a site code was configured, and whenever a visitor blocks
// analytics — so every call here is best-effort and must never throw into app
// code.

type GoatCounter = {
  count?: (vars: { path: string; title?: string; event?: boolean }) => void
}

const goatcounter = () =>
  (window as unknown as { goatcounter?: GoatCounter }).goatcounter

// Each event is sent at most once per page load, so an outage that fails
// many requests counts once per visitor instead of flooding the dashboard.
const sentEvents = new Set<string>()

// GoatCounter stores an event under a path, so keep it short and grouped by a
// prefix ("error/...", "fail/...", "perf/...") to keep the dashboard readable.
export function countEvent(path: string, title?: string) {
  const eventPath = path.slice(0, 200)
  if (sentEvents.has(eventPath)) return
  sentEvents.add(eventPath)
  try {
    goatcounter()?.count?.({ path: eventPath, title, event: true })
  } catch {
    // Analytics is never worth breaking a page over.
  }
}

const isAbort = (value: unknown) =>
  (value as { name?: unknown } | null)?.name === 'AbortError'

/** Counts errors the React error boundary cannot see (events, async code). */
export function countUncaughtErrors() {
  window.addEventListener('error', (event) => {
    // Errors from other origins (extensions, third-party scripts) arrive as
    // an opaque "Script error." with no error object, so they carry no signal.
    if (!event.error) return
    countEvent(`error/${event.error.name}: ${event.message}`, 'Uncaught error')
  })
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason as { name?: string; message?: string } | undefined
    if (isAbort(reason)) return
    countEvent(`error/${reason?.name ?? 'Rejection'}: ${reason?.message ?? String(reason)}`, 'Unhandled rejection')
  })
}

/**
 * Counts a request that still failed after its retries, grouped by query and
 * HTTP status, for example "fail/topSpeciesPool/429" or "fail/citySearch/network".
 */
export function countFailedQuery(queryName: string, error: Error) {
  if (isAbort(error)) return
  const status = /\((\d{3})\)/.exec(error.message)?.[1]
    ?? (error instanceof TypeError ? 'network' : 'other')
  countEvent(`fail/${queryName}/${status}`, 'Request failed')
}

/**
 * Counts a poster that shows no species at all. GBIF answering successfully
 * but without data (for example after a taxonomy change) is not an error,
 * so failed-request events would not catch it.
 */
export function countPosterWithoutSpecies() {
  countEvent('data/no-species', 'Poster without species')
}

/** Counts how long a visitor waited for their first poster, in buckets. */
export function countFirstPosterTime(seconds: number) {
  const bucket =
    seconds < 2 ? '0-2s'
    : seconds < 4 ? '2-4s'
    : seconds < 8 ? '4-8s'
    : seconds < 15 ? '8-15s'
    : '15s+'
  countEvent(`perf/first-poster/${bucket}`, 'First poster shown')
}
