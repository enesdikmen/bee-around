import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchOccurrenceFacets,
  fetchSpecies,
  fetchSpeciesVernacularNames,
} from '../../api/gbif'
import { fallbackTopSpecies } from '../../data/lensFallbacks'
import {
  HERO_SLOT_RULES,
  type HeroSlotRule,
} from '../../data/lensSelection'
import type { Place, SpeciesCard } from '../../types/lens'
import { placeGeoParams, seededPick } from './shared'

type TopSpeciesPoolData = {
  slots: Array<{
    slot: HeroSlotRule
    candidates: SpeciesCard[]
  }>
  vernacularsBySpecies: Record<
    number,
    Awaited<ReturnType<typeof fetchSpeciesVernacularNames>>['results']
  >
}

export type TopSpeciesResult = {
  topSpeciesData: SpeciesCard[]
  vernacularsBySpecies: TopSpeciesPoolData['vernacularsBySpecies']
}

export const useTopSpeciesData = (
  selectedPlace: Place | undefined,
  contentSeed: number,
): TopSpeciesResult => {
  const topSpeciesPoolQuery = useQuery({
    queryKey: ['topSpeciesPool', selectedPlace?.id],
    queryFn: async ({ signal }): Promise<TopSpeciesPoolData> => {
      if (!selectedPlace) return { slots: [], vernacularsBySpecies: {} }

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
          const response = await fetchOccurrenceFacets({
            ...placeGeoParams(selectedPlace),
            facetFields: ['speciesKey'],
            facetLimit: Math.max(slot.pickFromTop, 1),
            signal,
            ...filter,
          })

          const pool = (response.facets?.[0]?.counts ?? [])
            .map((c) => ({ speciesKey: Number(c.name), count: c.count }))
            .filter((c) => Number.isFinite(c.speciesKey))
            .slice(0, Math.max(slot.pickFromTop, 1))

          if (pool.length > 0) return { slot, pool }
        }
        return null
      }

      const slotPools = (
        await Promise.all(HERO_SLOT_RULES.map(getPoolForSlot))
      ).filter(
        (
          item,
        ): item is {
          slot: HeroSlotRule
          pool: Array<{ speciesKey: number; count: number }>
        } => item !== null,
      )

      const uniqueSpeciesKeys = Array.from(
        new Set(slotPools.flatMap((item) => item.pool.map((p) => p.speciesKey))),
      )

      const speciesInfo = await Promise.all(
        uniqueSpeciesKeys.map(async (speciesKey) => {
          const [species, vernacularNames] = await Promise.all([
            fetchSpecies({ speciesKey, signal }),
            fetchSpeciesVernacularNames({ speciesKey, signal }),
          ])

          return {
            speciesKey,
            cardBase: {
              id: String(speciesKey),
              commonName:
                species.vernacularName ??
                species.canonicalName ??
                species.scientificName,
              scientificName: species.scientificName,
              canonicalName: species.canonicalName ?? species.scientificName,
              imageUrl: '',
              taxonLine: [species.kingdom, species.phylum, species.class]
                .filter(Boolean)
                .join(' · '),
            },
            vernaculars: vernacularNames.results,
          }
        }),
      )

      const speciesByKey = new Map<number, (typeof speciesInfo)[number]['cardBase']>()
      const vernacularsBySpecies: TopSpeciesPoolData['vernacularsBySpecies'] = {}

      for (const info of speciesInfo) {
        speciesByKey.set(info.speciesKey, info.cardBase)
        vernacularsBySpecies[info.speciesKey] = info.vernaculars
      }

      const slots: TopSpeciesPoolData['slots'] = slotPools.map(({ slot, pool }) => {
        const candidates: SpeciesCard[] = []
        for (const candidate of pool) {
          const base = speciesByKey.get(candidate.speciesKey)
          if (!base) continue
          candidates.push({
            ...base,
            highlight: slot.label,
            popularity: candidate.count,
          })
        }
        return { slot, candidates }
      })

      return { slots, vernacularsBySpecies }
    },
    enabled: Boolean(selectedPlace),
    staleTime: Infinity,
    gcTime: Infinity,
  })

  const topSpeciesData = useMemo(() => {
    const slots = topSpeciesPoolQuery.data?.slots ?? []
    if (!slots.length) return fallbackTopSpecies

    const seen = new Set<string>()
    const picks: SpeciesCard[] = []
    for (const { slot, candidates } of slots) {
      if (!candidates.length) continue
      const chosen = seededPick(
        candidates,
        `${selectedPlace?.id ?? 'none'}:${slot.id}:${contentSeed}`,
      )
      if (seen.has(chosen.id)) continue
      seen.add(chosen.id)
      picks.push(chosen)
    }

    return picks.length ? picks : fallbackTopSpecies
  }, [topSpeciesPoolQuery.data, selectedPlace?.id, contentSeed])

  return {
    topSpeciesData,
    vernacularsBySpecies: topSpeciesPoolQuery.data?.vernacularsBySpecies ?? {},
  }
}
