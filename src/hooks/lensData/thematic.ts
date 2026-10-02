import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchOccurrenceFacets, fetchSpecies } from '../../api/gbif'
import {
  IN_SEASON_RULE,
  MIN_COUNT_RATIO,
  NIGHT_CREATURES_RULE,
  SMALL_WONDERS_RULE,
  type SmallWondersSourceRule,
  type TaxonFilter,
} from '../../data/lensSelection'
import type { Place, SpeciesCard, ThematicStripCard } from '../../types/lens'
import { placeGeoParams, seededShuffle } from './shared'
import { resolveSpeciesCards, type SpeciesPick } from './speciesCards'

/**
 * Each query fetches a small *candidate list* (not a single pick) so that
 * the cross-lens dedup pass in `dedupe.ts` can fall through to the next
 * candidate when [0] is already claimed by a higher-priority card. The
 * renderer (`bentoTiles.tsx`) only shows `species[0]`.
 *
 * We return all 3 themes in a deterministic shuffled order; dedup picks
 * the first 2 that still have surviving candidates after filtering.
 */
/** Seed-independent candidate species per theme. */
export type ThematicPools = {
  speciesByTheme: Partial<Record<ThematicStripCard['id'], SpeciesCard[]>>
  /** 1-12; the in-season theme uses this month's records. */
  currentMonth: number
}

const NO_THEME_SPECIES: ThematicPools['speciesByTheme'] = {}

const rotateThematicSpecies = (
  species: SpeciesCard[],
  seedKey: string,
): SpeciesCard[] => {
  const topCount = species[0]?.popularity ?? 0
  const viable = species
    .slice(0, 3)
    .filter(
      (sp, index) =>
        index < 2 ||
        (topCount > 0 && (sp.popularity ?? 0) >= topCount * MIN_COUNT_RATIO),
    )
  return seededShuffle(viable, seedKey)
}

/** Seeded rotation and order of the theme cards. Pure: same pools + seed, same result. */
export const selectThematicStripCards = (
  { speciesByTheme, currentMonth }: ThematicPools,
  placeId: string,
  contentSeed: number,
): ThematicStripCard[] => {
  const monthLabel = new Date(2000, currentMonth - 1, 1).toLocaleString('en', {
    month: 'long',
  })
  const all: ThematicStripCard[] = [
    {
      id: 'inSeason',
      kicker: `🌸 In season · ${monthLabel}`,
      species: rotateThematicSpecies(
        speciesByTheme.inSeason ?? [],
        `${placeId}:thematic-species:inSeason:${contentSeed}`,
      ),
    },
    {
      id: 'smallWonders',
      kicker: '🐛 Small wonder',
      species: rotateThematicSpecies(
        speciesByTheme.smallWonders ?? [],
        `${placeId}:thematic-species:smallWonders:${contentSeed}`,
      ),
    },
    {
      id: 'nightCreatures',
      kicker: '🌃 Night creature',
      species: rotateThematicSpecies(
        speciesByTheme.nightCreatures ?? [],
        `${placeId}:thematic-species:nightCreatures:${contentSeed}`,
      ),
    },
  ]
  // Deterministic shuffle per place + seed; dedup picks the first two
  // surviving themes downstream.
  return seededShuffle(all, `${placeId}:thematic:${contentSeed}`)
}

export const useThematicPools = (
  selectedPlace: Place | undefined,
  commonNameLanguage: string,
): ThematicPools & { isReady: boolean } => {
  const currentMonth = new Date().getMonth() + 1

  const resolveMergedStrip = async (
    sources: SmallWondersSourceRule[],
    facetLimit: number,
    stripSize: number,
    signal: AbortSignal | undefined,
  ): Promise<SpeciesPick[]> => {
    if (!selectedPlace) return []

    // GBIF ORs repeated values of one filter (familyKey=a&familyKey=b), so
    // sources are searched once per filter type instead of once per source.
    // Each source has exactly one filter. Every species belongs to a single
    // order and family, so its count matches the per-source search.
    const groups = new Map<keyof TaxonFilter, SmallWondersSourceRule[]>()
    for (const source of sources) {
      const field = Object.keys(source.filter)[0] as keyof TaxonFilter
      groups.set(field, [...(groups.get(field) ?? []), source])
    }

    const responses = await Promise.all(
      Array.from(groups, async ([field, group]) => {
        const values = group.map((source) => source.filter[field] as number)
        const response = await fetchOccurrenceFacets({
          ...placeGeoParams(selectedPlace),
          facetFields: ['speciesKey'],
          facetLimit,
          signal,
          [field]: values.length === 1 ? values[0] : values,
        })
        return { field, group, response }
      }),
    )

    const all = responses
      .flatMap(({ field, group, response }) =>
        (response.facets?.[0]?.counts ?? []).map((c) => ({
          speciesKey: Number(c.name),
          count: c.count,
          field,
          group,
        })),
      )
      .filter((c) => Number.isFinite(c.speciesKey))
      .sort((a, b) => b.count - a.count || a.speciesKey - b.speciesKey)

    const seen = new Set<number>()
    const top: typeof all = []
    for (const item of all) {
      if (seen.has(item.speciesKey)) continue
      seen.add(item.speciesKey)
      top.push(item)
      if (top.length >= stripSize) break
    }

    // A merged search does not say which source matched, so read the
    // species' own order/family key. The same metadata request is reused
    // when the cards are built.
    return Promise.all(
      top.map(async ({ speciesKey, count, field, group }) => {
        if (group.length === 1) return { speciesKey, count, highlight: group[0].label }
        const species = await fetchSpecies({ speciesKey, signal, language: commonNameLanguage })
        const source = group.find((s) => species[field as keyof typeof species] === s.filter[field])
        return { speciesKey, count, highlight: (source ?? group[0]).label }
      }),
    )
  }

  const inSeasonQuery = useQuery({
    queryKey: ['lensInSeason', selectedPlace?.id, currentMonth],
    queryFn: async ({ signal }): Promise<SpeciesPick[]> => {
      if (!selectedPlace) return []
      const response = await fetchOccurrenceFacets({
        ...placeGeoParams(selectedPlace),
        facetFields: ['speciesKey'],
        facetLimit: IN_SEASON_RULE.facetLimit,
        month: currentMonth,
        signal,
      })
      const counts = response.facets?.[0]?.counts ?? []
      const picks = counts
        .map((c) => ({ speciesKey: Number(c.name), count: c.count }))
        .filter((c) => Number.isFinite(c.speciesKey))
        .sort((a, b) => b.count - a.count || a.speciesKey - b.speciesKey)
        .slice(0, IN_SEASON_RULE.stripSize)
        .map((c) => ({ ...c, highlight: IN_SEASON_RULE.highlight }))
      return picks
    },
    enabled: Boolean(selectedPlace),
    staleTime: 1000 * 60 * 30,
  })

  const smallWondersQuery = useQuery({
    queryKey: ['lensSmallWonders', selectedPlace?.id],
    queryFn: async ({ signal }): Promise<SpeciesPick[]> => {
      return resolveMergedStrip(
        SMALL_WONDERS_RULE.sources,
        SMALL_WONDERS_RULE.facetLimit,
        SMALL_WONDERS_RULE.stripSize,
        signal,
      )
    },
    enabled: Boolean(selectedPlace),
    staleTime: 1000 * 60 * 30,
  })

  const nightCreaturesQuery = useQuery({
    queryKey: ['lensNightCreatures', selectedPlace?.id],
    queryFn: async ({ signal }): Promise<SpeciesPick[]> => {
      return resolveMergedStrip(
        NIGHT_CREATURES_RULE.sources,
        NIGHT_CREATURES_RULE.facetLimit,
        NIGHT_CREATURES_RULE.stripSize,
        signal,
      )
    },
    enabled: Boolean(selectedPlace),
    staleTime: 1000 * 60 * 30,
  })

  const thematicPickGroups = useMemo(
    () => [
      { id: 'inSeason' as const, picks: inSeasonQuery.data ?? [] },
      { id: 'smallWonders' as const, picks: smallWondersQuery.data ?? [] },
      { id: 'nightCreatures' as const, picks: nightCreaturesQuery.data ?? [] },
    ],
    [
      inSeasonQuery.data,
      smallWondersQuery.data,
      nightCreaturesQuery.data,
    ],
  )

  const thematicPickSignature = useMemo(
    () =>
      thematicPickGroups
        .map((group) =>
          `${group.id}:${group.picks
            .map((p) => `${p.speciesKey}:${p.count}:${p.highlight}`)
            .join('|')}`,
        )
        .join(';'),
    [thematicPickGroups],
  )

  const thematicCardsQuery = useQuery({
    queryKey: [
      'thematicSpeciesCards',
      selectedPlace?.id,
      commonNameLanguage,
      thematicPickSignature,
    ],
    queryFn: async ({ signal }) => {
      const entries = await Promise.all(
        thematicPickGroups.map(async (group) => [
          group.id,
          await resolveSpeciesCards(group.picks, signal, commonNameLanguage),
        ] as const),
      )
      return Object.fromEntries(entries) as Record<
        ThematicStripCard['id'],
        SpeciesCard[]
      >
    },
    enabled: thematicPickGroups.some((group) => group.picks.length > 0),
    staleTime: 1000 * 60 * 60,
  })

  const arePickQueriesReady = [
    inSeasonQuery,
    smallWondersQuery,
    nightCreaturesQuery,
  ].every((q) => q.isSuccess || q.isError)
  const hasThematicPicks = thematicPickGroups.some((group) => group.picks.length > 0)
  const isReady =
    !selectedPlace ||
    (arePickQueriesReady &&
      (!hasThematicPicks || thematicCardsQuery.isSuccess || thematicCardsQuery.isError))

  const speciesByTheme = thematicCardsQuery.data ?? NO_THEME_SPECIES
  return useMemo(
    () => ({ speciesByTheme, currentMonth, isReady }),
    [speciesByTheme, currentMonth, isReady],
  )
}
