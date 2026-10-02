import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchOccurrenceFacets,
  fetchSpecies,
} from '../../api/gbif'
import {
  DEFAULT_PICK_FROM_TOP,
  EXTRA_MINI_SLOT_COUNT,
  EXTRA_MINI_SLOT_RULES,
  HERO_SLOT_RULES,
  MIN_COUNT_RATIO,
  MIN_VIABLE_CANDIDATES,
  SPECIES_FACET_LIMIT,
  type HeroSlotRule,
} from '../../data/lensSelection'
import type { Place, SpeciesCard } from '../../types/lens'
import { placeGeoParams, seededShuffle } from './shared'
import { speciesCardBase } from './speciesCards'

type TopSpeciesPoolData = {
  slots: TopSpeciesSlotPool[]
  extraMiniSlots: TopSpeciesSlotPool[]
}

type TopSpeciesSlotPool = {
  slot: HeroSlotRule
  pool: Array<{ speciesKey: number; count: number }>
}

type SlotCandidates = {
  slot: HeroSlotRule
  candidates: SpeciesCard[]
}

/** Seed-independent candidates for the hero and mini slots. */
export type TopSpeciesPools = {
  slots: SlotCandidates[]
  extraMiniSlots: SlotCandidates[]
}

const buildCandidates = (
  pools: TopSpeciesSlotPool[],
  speciesByKey: Map<number, Omit<SpeciesCard, 'highlight'>> | undefined,
): SlotCandidates[] =>
  pools.map(({ slot, pool }) => {
    const candidates: SpeciesCard[] = []
    for (const candidate of pool) {
      const base = speciesByKey?.get(candidate.speciesKey)
      if (!base) continue
      candidates.push({
        ...base,
        highlight: slot.label,
        popularity: candidate.count,
      })
    }
    // Keep only candidates with enough observations relative to the
    // slot's top hit so sparse places don't surface irrelevant species,
    // but always keep at least MIN_VIABLE_CANDIDATES so a single dominant
    // species can't collapse the slot to one pick.
    const topCount = candidates[0]?.popularity ?? 0
    const viable =
      topCount > 0
        ? candidates.filter(
            (c, i) =>
              i < MIN_VIABLE_CANDIDATES ||
              (c.popularity ?? 0) >= topCount * MIN_COUNT_RATIO,
          )
        : candidates
    return { slot, candidates: viable }
  })

/** Seeded picks for the hero and mini cards. Pure: same pools + seed, same picks. */
export const selectTopSpecies = (
  { slots, extraMiniSlots }: TopSpeciesPools,
  placeId: string,
  contentSeed: number,
): SpeciesCard[] => {
  if (!slots.length) return []

  const pickUnseenForSlot = (
    candidates: SpeciesCard[],
    seedKey: string,
    seen: Set<string>,
  ) => {
    const ordered = seededShuffle(candidates, `${seedKey}:order`)
    return ordered.find((candidate) => !seen.has(candidate.id))
  }

  const seen = new Set<string>()
  const picks: SpeciesCard[] = []
  for (const { slot, candidates } of slots) {
    if (!candidates.length) continue
    const chosen = pickUnseenForSlot(candidates, `${placeId}:${slot.id}:${contentSeed}`, seen)
    if (!chosen) continue
    seen.add(chosen.id)
    picks.push(chosen)
  }

  const shuffledExtraMiniSlots = seededShuffle(
    extraMiniSlots,
    `${placeId}:extra-mini-slots:${contentSeed}`,
  )
  for (const { slot, candidates } of shuffledExtraMiniSlots) {
    if (picks.length >= slots.length + EXTRA_MINI_SLOT_COUNT) break
    if (!candidates.length) continue
    const chosen = pickUnseenForSlot(candidates, `${placeId}:${slot.id}:${contentSeed}`, seen)
    if (!chosen) continue
    seen.add(chosen.id)
    picks.push(chosen)
  }

  return picks
}

export const useTopSpeciesPools = (
  selectedPlace: Place | undefined,
  commonNameLanguage: string,
): TopSpeciesPools & { isReady: boolean } => {
  const topSpeciesPoolQuery = useQuery({
    queryKey: ['topSpeciesPool', selectedPlace?.id],
    queryFn: async ({ signal }): Promise<TopSpeciesPoolData> => {
      if (!selectedPlace) return { slots: [], extraMiniSlots: [] }

      const getPoolForSlot = async (
        slot: HeroSlotRule,
      ): Promise<
        | {
            slot: HeroSlotRule
            pool: Array<{ speciesKey: number; count: number }>
          }
        | null
      > => {
        for (const filter of slot.filters) {
          const pick = slot.pickFromTop ?? DEFAULT_PICK_FROM_TOP
          const response = await fetchOccurrenceFacets({
            ...placeGeoParams(selectedPlace),
            facetFields: ['speciesKey'],
            facetLimit: Math.max(pick, SPECIES_FACET_LIMIT),
            signal,
            ...filter,
          })

          const pool = (response.facets?.[0]?.counts ?? [])
            .map((c) => ({ speciesKey: Number(c.name), count: c.count }))
            .filter((c) => Number.isFinite(c.speciesKey))
            .sort((a, b) => b.count - a.count || a.speciesKey - b.speciesKey)
            .slice(0, pick)

          if (pool.length > 0) return { slot, pool }
        }
        return null
      }

      const buildSlotPools = async (rules: HeroSlotRule[]) =>
        (
          await Promise.all(rules.map(getPoolForSlot))
        ).filter(
          (
            item,
          ): item is {
            slot: HeroSlotRule
            pool: Array<{ speciesKey: number; count: number }>
          } => item !== null,
        )

      // Queue both groups now. Awaiting the heroes first sent the extra
      // searches to the back of the GBIF queue. Each group keeps its order.
      const [slotPools, extraMiniSlotPools] = await Promise.all([
        buildSlotPools(HERO_SLOT_RULES),
        buildSlotPools(EXTRA_MINI_SLOT_RULES),
      ])

      return { slots: slotPools, extraMiniSlots: extraMiniSlotPools }
    },
    enabled: Boolean(selectedPlace),
    staleTime: Infinity,
    gcTime: Infinity,
    // Share-link fidelity: hero/mini slots are deterministic only when
    // this pool resolves successfully. Transient GBIF blips on a fresh tab
    // should not be hidden by static species; failed pools simply omit those
    // cards and let the poster fill remaining cells with non-species fillers.
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  })

  const uniqueSpeciesKeys = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...(topSpeciesPoolQuery.data?.slots ?? []),
            ...(topSpeciesPoolQuery.data?.extraMiniSlots ?? []),
          ].flatMap((item) => item.pool.map((p) => p.speciesKey)),
        ),
      ),
    [topSpeciesPoolQuery.data],
  )

  const speciesInfoQuery = useQuery({
    queryKey: ['topSpeciesInfo', selectedPlace?.id, commonNameLanguage, uniqueSpeciesKeys],
    queryFn: async ({ signal }) => {
      const uniqueSpeciesKeys = Array.from(
        new Set(
          [
            ...(topSpeciesPoolQuery.data?.slots ?? []),
            ...(topSpeciesPoolQuery.data?.extraMiniSlots ?? []),
          ].flatMap((item) =>
            item.pool.map((p) => p.speciesKey),
          ),
        ),
      )

      const speciesInfo = await Promise.all(
        uniqueSpeciesKeys.map(async (speciesKey) => {
          const species = await fetchSpecies({
            speciesKey,
            signal,
            language: commonNameLanguage,
          })

          return {
            speciesKey,
            cardBase: speciesCardBase(speciesKey, species),
          }
        }),
      )

      const speciesByKey = new Map<number, (typeof speciesInfo)[number]['cardBase']>()

      for (const info of speciesInfo) {
        speciesByKey.set(info.speciesKey, info.cardBase)
      }

      return speciesByKey
    },
    enabled: uniqueSpeciesKeys.length > 0,
    staleTime: 1000 * 60 * 60,
  })

  const slots = useMemo(
    () => buildCandidates(topSpeciesPoolQuery.data?.slots ?? [], speciesInfoQuery.data),
    [topSpeciesPoolQuery.data?.slots, speciesInfoQuery.data],
  )

  const extraMiniSlots = useMemo(
    () => buildCandidates(topSpeciesPoolQuery.data?.extraMiniSlots ?? [], speciesInfoQuery.data),
    [topSpeciesPoolQuery.data?.extraMiniSlots, speciesInfoQuery.data],
  )

  const isReady =
    !selectedPlace ||
    topSpeciesPoolQuery.isError ||
    (topSpeciesPoolQuery.isSuccess &&
      (uniqueSpeciesKeys.length === 0 ||
        speciesInfoQuery.isSuccess ||
        speciesInfoQuery.isError))

  return useMemo(() => ({ slots, extraMiniSlots, isReady }), [slots, extraMiniSlots, isReady])
}
