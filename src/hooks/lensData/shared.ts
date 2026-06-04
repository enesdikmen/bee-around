import type { Place } from '../../types/lens'

/** Build GBIF geo params from a Place, preferring Nominatim bbox when present. */
export const placeGeoParams = (place: Place) => ({
  latitude: place.latitude,
  longitude: place.longitude,
  radiusKm: place.radiusKm,
  bbox: place.bbox,
  countryCode: place.countryCode,
})

const hashText = (value: string) => {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const mulberry32 = (seed: number) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const seededPick = <T,>(items: T[], seedKey: string): T => {
  if (items.length === 1) return items[0]
  const rnd = mulberry32(hashText(seedKey))
  return items[Math.floor(rnd() * items.length)]
}

export const seededShuffle = <T,>(items: T[], seedKey: string): T[] => {
  const rnd = mulberry32(hashText(seedKey))
  const copy = items.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
