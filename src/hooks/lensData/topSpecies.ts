import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchOccurrenceFacets,
  fetchSpecies,
} from '../../api/gbif'
import { fallbackTopSpecies } from '../../data/lensFallbacks'
import {
  DEFAULT_PICK_FROM_TOP,
  EXTRA_MINI_SLOT_COUNT,
  EXTRA_MINI_SLOT_RULES,
  HERO_SLOT_RULES,
  MAX_SPECIES_MINI_COUNT,
  MIN_COUNT_RATIO,
  MIN_VIABLE_CANDIDATES,
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

const buildCandidates = (
  pools: TopSpeciesSlotPool[],
  speciesByKey: Map<number, Omit<SpeciesCard, 'highlight'>> | undefined,
): Array<{
  slot: HeroSlotRule
  candidates: SpeciesCard[]
}> =>
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

export type TopSpeciesResult = {
  topSpeciesData: SpeciesCard[]
  isReady: boolean
}

export const useTopSpeciesData = (
  selectedPlace: Place | undefined,
  contentSeed: number,
  commonNameLanguage: string,
): TopSpeciesResult => {
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
            facetLimit: pick,
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

      const slotPools = await buildSlotPools(HERO_SLOT_RULES)
      const extraMiniSlotPools = await buildSlotPools(EXTRA_MINI_SLOT_RULES)

      return { slots: slotPools, extraMiniSlots: extraMiniSlotPools }
    },
    enabled: Boolean(selectedPlace),
    staleTime: Infinity,
    gcTime: Infinity,
    // Share-link fidelity: hero/mini slots are deterministic only when
    // this pool resolves successfully. Transient GBIF blips on a fresh
    // tab would otherwise fall back to `fallbackTopSpecies`, changing
    // every card on the poster.
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

  const topSpeciesData = useMemo(() => {
    if (!slots.length) return fallbackTopSpecies

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
      const chosen = pickUnseenForSlot(
        candidates,
        `${selectedPlace?.id ?? 'none'}:${slot.id}:${contentSeed}`,
        seen,
      )
      if (!chosen) continue
      seen.add(chosen.id)
      picks.push(chosen)
    }

    const shuffledExtraMiniSlots = seededShuffle(
      extraMiniSlots,
      `${selectedPlace?.id ?? 'none'}:extra-mini-slots:${contentSeed}`,
    )
    for (const { slot, candidates } of shuffledExtraMiniSlots) {
      if (picks.length >= slots.length + EXTRA_MINI_SLOT_COUNT) break
      if (!candidates.length) continue
      const chosen = pickUnseenForSlot(
        candidates,
        `${selectedPlace?.id ?? 'none'}:${slot.id}:${contentSeed}`,
        seen,
      )
      if (!chosen) continue
      seen.add(chosen.id)
      picks.push(chosen)
    }

    // Backfill from fallback cards so mini slots can still render when local
    // category data is sparse.
    const minimumCount = 1 + MAX_SPECIES_MINI_COUNT
    if (picks.length < minimumCount) {
      for (const fallback of seededShuffle(
        fallbackTopSpecies,
        `${selectedPlace?.id ?? 'none'}:fallback-top-species:${contentSeed}`,
      )) {
        if (seen.has(fallback.id)) continue
        seen.add(fallback.id)
        picks.push(fallback)
        if (picks.length >= minimumCount) break
      }
    }

    return picks.length ? picks : fallbackTopSpecies
  }, [slots, extraMiniSlots, selectedPlace?.id, contentSeed])

  return {
    topSpeciesData,
    isReady:
      !selectedPlace ||
      topSpeciesPoolQuery.isError ||
      (topSpeciesPoolQuery.isSuccess &&
        (uniqueSpeciesKeys.length === 0 ||
          speciesInfoQuery.isSuccess ||
          speciesInfoQuery.isError)),
  }
}
