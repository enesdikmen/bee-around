import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchOccurrenceFacets, fetchSpecies, fetchSpeciesIucnCategory } from '../../api/gbif'
import { IUCN_LABELS } from '../../data/lensFallbacks'
import type { ConservationSnapshot, Place, ThreatenedSpecies } from '../../types/lens'
import { placeGeoParams, seededPick } from './shared'
import { speciesCardBase } from './speciesCards'


const THREATENED_CATS = ['CR', 'EN', 'VU'] as const
const ALL_CATS = ['LC', 'NT', 'VU', 'EN', 'CR', 'DD'] as const
const IUCN_SPECIES_COUNT_FACET_LIMIT = 40000
// Wider than the cards need, because candidates whose species-level category
// disagrees are dropped (see fetchSpeciesIucnCategory).
const THREATENED_FACET_LIMIT = 12
const THREATENED_PICK_FROM_TOP_PER_GROUP = 3

type ThreatenedCandidate = {
  speciesKey: number
  count: number
  group: string
  species: Awaited<ReturnType<typeof fetchSpecies>>
  winningCat: (typeof THREATENED_CATS)[number]
}

type ThreatenedPoolCandidate = Omit<ThreatenedCandidate, 'group' | 'species'>

/** Seed-independent conservation data: red-list counts and threatened candidates. */
export type ConservationPools = {
  counts: Omit<ConservationSnapshot, 'threatenedSpecies'>
  threatenedCandidates: ThreatenedCandidate[]
}

/** Seeded pick of one threatened species per group. Pure: same pools + seed, same result. */
export const selectConservationSnapshot = (
  { counts, threatenedCandidates }: ConservationPools,
  placeId: string,
  contentSeed: number,
): ConservationSnapshot => {
  const groupedThreatened = new Map<string, ThreatenedCandidate[]>()
  for (const candidate of threatenedCandidates) {
    const bucket = groupedThreatened.get(candidate.group)
    if (bucket) {
      bucket.push(candidate)
    } else {
      groupedThreatened.set(candidate.group, [candidate])
    }
  }

  const threatenedSpecies = Array.from(groupedThreatened.entries())
    .map(([group, bucket]) => {
      bucket.sort((a, b) => b.count - a.count || a.speciesKey - b.speciesKey)
      const top = bucket.slice(0, THREATENED_PICK_FROM_TOP_PER_GROUP)
      const picked = seededPick(top, `${placeId}:threatened:${group}:${contentSeed}`)
      return {
        ...speciesCardBase(picked.speciesKey, picked.species),
        highlight: IUCN_LABELS[picked.winningCat] ?? picked.winningCat,
        popularity: picked.count,
        iucnCategory: picked.winningCat,
        iucnLabel: IUCN_LABELS[picked.winningCat] ?? picked.winningCat,
      } as ThreatenedSpecies
    })
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))

  return { ...counts, threatenedSpecies }
}

const NO_THREATENED_CANDIDATES: ThreatenedCandidate[] = []

export const useConservationPools = (
  selectedPlace: Place | undefined,
  commonNameLanguage: string,
): ConservationPools & { isReady: boolean } => {
  const speciesCountsQuery = useQuery({
    queryKey: ['iucnSpeciesCounts', selectedPlace?.id],
    queryFn: async ({ signal }) => {
      if (!selectedPlace) return []
      // These are GBIF's heaviest searches, and several in a row drew 429s
      // in testing. Nothing on the poster waits for them, so send them one
      // at a time, after other queued searches.
      const results = []
      for (const cat of ALL_CATS) {
        const response = await fetchOccurrenceFacets({
          ...placeGeoParams(selectedPlace),
          facetFields: ['speciesKey'],
          facetLimit: IUCN_SPECIES_COUNT_FACET_LIMIT,
          iucnRedListCategory: cat,
          signal,
          queuePriority: 'low',
        })
        const speciesCount = response.facets?.[0]?.counts?.length ?? 0
        results.push({
          status: cat,
          label: IUCN_LABELS[cat] ?? cat,
          speciesCount,
          isCapped: speciesCount >= IUCN_SPECIES_COUNT_FACET_LIMIT,
        })
      }
      return results
    },
    enabled: Boolean(selectedPlace),
    staleTime: 1000 * 60 * 10,
  })

  const threatenedSpeciesPoolQuery = useQuery({
    queryKey: ['threatenedSpeciesPool', selectedPlace?.id],
    queryFn: async ({ signal }): Promise<ThreatenedPoolCandidate[]> => {
      if (!selectedPlace) return []

      // Cascade: use the highest severity that has confirmed results. A
      // candidate counts only when its species-level category agrees with
      // the occurrence tag; a failed check drops it rather than risk
      // calling a common species threatened.
      let raw: Array<{ speciesKey: number; count: number }> = []
      let winningCat: (typeof THREATENED_CATS)[number] = 'CR'
      for (const cat of THREATENED_CATS) {
        const response = await fetchOccurrenceFacets({
          ...placeGeoParams(selectedPlace),
          facetFields: ['speciesKey'],
          facetLimit: THREATENED_FACET_LIMIT,
          iucnRedListCategory: cat,
          signal,
        })
        const tagged = (response.facets?.[0]?.counts ?? [])
          .map((c) => ({ speciesKey: Number(c.name), count: c.count }))
          .filter((c) => Number.isFinite(c.speciesKey))
        const confirmed = await Promise.all(
          tagged.map((c) =>
            fetchSpeciesIucnCategory({ speciesKey: c.speciesKey, signal }).then(
              (code) => code === cat,
              () => false,
            ),
          ),
        )
        raw = tagged
          .filter((_, i) => confirmed[i])
          .sort((a, b) => b.count - a.count || a.speciesKey - b.speciesKey)
        if (raw.length > 0) {
          winningCat = cat
          break
        }
      }
      if (!raw.length) return []

      return raw.map((item) => ({ ...item, winningCat }))
    },
    enabled: Boolean(selectedPlace),
    staleTime: 1000 * 60 * 30,
  })

  const threatenedSpeciesKeys = useMemo(
    () => threatenedSpeciesPoolQuery.data?.map((item) => item.speciesKey) ?? [],
    [threatenedSpeciesPoolQuery.data],
  )

  const threatenedSpeciesQuery = useQuery({
    queryKey: [
      'threatenedSpeciesInfo',
      selectedPlace?.id,
      commonNameLanguage,
      threatenedSpeciesKeys,
    ],
    queryFn: async ({ signal }): Promise<ThreatenedCandidate[]> => {
      const resolved = await Promise.all(
        (threatenedSpeciesPoolQuery.data ?? []).map(async (item) => {
          const species = await fetchSpecies({
            speciesKey: item.speciesKey,
            signal,
            language: commonNameLanguage,
          })
          return { ...item, species }
        }),
      )

      // Group candidates for per-group seeded picks in useMemo.
      resolved.sort((a, b) => b.count - a.count || a.speciesKey - b.speciesKey)
      return resolved.map((item) => {
        const group =
          item.species.kingdom === 'Animalia'
            ? (item.species.class ?? 'unknown')
            : (item.species.kingdom ?? 'unknown')
        return {
          speciesKey: item.speciesKey,
          count: item.count,
          group,
          species: item.species,
          winningCat: item.winningCat,
        }
      })
    },
    enabled: threatenedSpeciesKeys.length > 0,
    staleTime: 1000 * 60 * 60,
  })

  // The counts only fill the red-list numbers on the sightings card, and
  // arrive after the poster is shown. Species cards never depend on them,
  // so a slow or failed count cannot change which species appear.
  const counts = useMemo<ConservationPools['counts']>(() => {
    if (!speciesCountsQuery.data?.length) {
      return {
        countsStatus: speciesCountsQuery.isError ? 'error' : 'pending',
        totalAssessedSpecies: 0,
        threatenedCount: 0,
        threatenedPercent: 0,
        categoryBreakdown: [],
      }
    }

    const categoryBreakdown = speciesCountsQuery.data.map((c) => ({
      status: c.status,
      label: c.label,
      count: c.speciesCount,
      isCapped: c.isCapped,
    }))

    const totalAssessedSpecies = categoryBreakdown.reduce(
      (sum, c) => sum + c.count,
      0,
    )
    const threatenedCount = categoryBreakdown
      .filter((c) =>
        (THREATENED_CATS as readonly string[]).includes(c.status),
      )
      .reduce((sum, c) => sum + c.count, 0)
    const threatenedPercent =
      totalAssessedSpecies > 0
        ? Math.round((threatenedCount / totalAssessedSpecies) * 1000) / 10
        : 0

    return {
      countsStatus: 'ready',
      totalAssessedSpecies,
      threatenedCount,
      threatenedPercent,
      categoryBreakdown,
    }
  }, [speciesCountsQuery.data, speciesCountsQuery.isError])

  // Red-list counts are deliberately not part of readiness (see above).
  const isReady =
    !selectedPlace ||
    ((threatenedSpeciesPoolQuery.isSuccess || threatenedSpeciesPoolQuery.isError) &&
      (threatenedSpeciesKeys.length === 0 ||
        threatenedSpeciesQuery.isSuccess ||
        threatenedSpeciesQuery.isError))

  const threatenedCandidates = threatenedSpeciesQuery.data ?? NO_THREATENED_CANDIDATES
  return useMemo(
    () => ({ counts, threatenedCandidates, isReady }),
    [counts, threatenedCandidates, isReady],
  )
}
