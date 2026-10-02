import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchDatasetMetadata,
  fetchOccurrenceFacets,
  fetchSpecies,
} from '../api/gbif'
import type {
  DatasetSummary,
  Place,
} from '../types/lens'
import {
  selectConservationSnapshot,
  useConservationPools,
  type ConservationPools,
} from './lensData/conservation'
import { dedupeSpeciesAcrossLenses } from './lensData/dedupe'
import { buildRecordsBreakdown } from './lensData/recordsBreakdown'
import { facetCounts, placeSummaryRequest } from './lensData/shared'
import {
  selectThematicStripCards,
  useThematicPools,
  type ThematicPools,
} from './lensData/thematic'
import {
  selectTopSpecies,
  useTopSpeciesPools,
  type TopSpeciesPools,
} from './lensData/topSpecies'
import {
  useLiveSignatureSpecies,
  type SignatureSpeciesCard,
} from './lensData/signatureSpecies'
import type {
  LensData,
  LensSummary,
  YearSummary,
} from './lensData/types'

export type { LensData, RecordsBreakdownItem } from './lensData/types'

/**
 * Everything fetched for a place. None of it depends on the poster seed, so
 * the poster for any seed (the current one, or the seed a locked card was
 * captured at) is computed from the same pools with {@link selectLensData}.
 */
export type LensPools = {
  /** True when every query a poster needs has settled. */
  isReady: boolean
  placeId: string
  summary: LensSummary
  top: TopSpeciesPools
  thematic: ThematicPools
  conservation: ConservationPools
  signatureSpeciesData: SignatureSpeciesCard[]
}

/** Seeded picks for one poster. Pure: the same pools and seed give the same data. */
export const selectLensData = (pools: LensPools, seed: number): LensData =>
  dedupeSpeciesAcrossLenses({
    ...pools.summary,
    topSpeciesData: selectTopSpecies(pools.top, pools.placeId, seed),
    thematicStripCards: selectThematicStripCards(pools.thematic, pools.placeId, seed),
    conservationSnapshot: selectConservationSnapshot(pools.conservation, pools.placeId, seed),
    signatureSpeciesData: pools.signatureSpeciesData,
  })

export const useLensPools = (
  selectedPlace: Place | undefined,
  commonNameLanguage: string,
): LensPools => {
  const activePlace = selectedPlace
  const enabled = Boolean(selectedPlace)

  const facetsQuery = useQuery({
    queryKey: ['occurrenceFacets', activePlace?.id],
    queryFn: ({ signal }) =>
      fetchOccurrenceFacets({
        ...(activePlace
          ? placeSummaryRequest(activePlace)
          : { latitude: 0, longitude: 0, radiusKm: 0, facetFields: [] }),
        signal,
      }),
    enabled: enabled && Boolean(activePlace),
    staleTime: 1000 * 60 * 10,
  })

  const facetsSummary = useMemo(() => {
    const data = facetsQuery.data
    if (!data) return null
    return {
      month: facetCounts(data, 'month'),
      year: facetCounts(data, 'year'),
      datasetKey: facetCounts(data, 'datasetKey'),
      kingdomKey: facetCounts(data, 'kingdomKey'),
      basisOfRecord: facetCounts(data, 'basisOfRecord'),
    }
  }, [facetsQuery.data])

  const seasonalityData = useMemo(() => {
    // Empty means unavailable: never substitute example numbers.
    if (!facetsSummary?.month?.length) return []
    const countsByMonth = facetsSummary.month.reduce<Record<number, number>>(
      (acc, item) => {
        const parsed = Number(item.name)
        if (Number.isFinite(parsed)) acc[parsed] = item.count
        return acc
      },
      {},
    )
    return Array.from({ length: 12 }, (_, index) =>
      countsByMonth[index + 1] ?? 0,
    )
  }, [facetsSummary])

  const yearSummary = useMemo<YearSummary | null>(() => {
    if (!facetsSummary?.year?.length) return null
    const entries = facetsSummary.year
      .map((item) => ({ year: Number(item.name), count: item.count }))
      .filter((e) => Number.isFinite(e.year) && e.year > 0)
      .sort((a, b) => a.year - b.year)
    if (entries.length === 0) return null

    const firstYear = entries[0].year
    const peak = entries.reduce((best, e) => (e.count > best.count ? e : best), entries[0])

    return {
      firstYear,
      peakYear: peak.year,
      peakYearCount: peak.count,
      yearCounts: entries,
    }
  }, [facetsSummary])

  const top = useTopSpeciesPools(activePlace, commonNameLanguage)
  const thematic = useThematicPools(activePlace, commonNameLanguage)
  const conservation = useConservationPools(activePlace, commonNameLanguage)

  const kingdomKeys = useMemo(
    () =>
      facetsSummary?.kingdomKey
        ?.map((item) => Number(item.name))
        .filter((value) => Number.isFinite(value))
        .slice(0, 5) ?? [],
    [facetsSummary],
  )

  const taxonLabelsQuery = useQuery({
    queryKey: ['taxonLabels', kingdomKeys],
    queryFn: async ({ signal }) => {
      const entries = await Promise.all(
        kingdomKeys.map(async (key) => {
          const species = await fetchSpecies({ speciesKey: key, signal })
          return [
            key,
            species.canonicalName ?? species.scientificName ?? `Key ${key}`,
          ] as const
        }),
      )
      return Object.fromEntries(entries)
    },
    enabled: kingdomKeys.length > 0,
    staleTime: 1000 * 60 * 60,
  })

  const kingdomBreakdown = useMemo(() => {
    if (!facetsSummary?.kingdomKey?.length) return []
    return facetsSummary.kingdomKey
      .slice(0, 5)
      .map((item) => {
        const key = Number(item.name)
        return {
          label: taxonLabelsQuery.data?.[key] ?? `Key ${item.name}`,
          count: item.count,
        }
      })
  }, [facetsSummary, taxonLabelsQuery.data])

  const datasetKeys = useMemo(() => {
    if (!facetsSummary?.datasetKey?.length) return []
    return facetsSummary.datasetKey
      .slice(0, 5)
      .map((item) => item.name)
  }, [facetsSummary])

  const datasetCountsByKey = useMemo<Record<string, number>>(() => {
    if (!facetsSummary?.datasetKey?.length) return {}
    return Object.fromEntries(
      facetsSummary.datasetKey.map((item) => [item.name, item.count]),
    )
  }, [facetsSummary])

  const datasetQuery = useQuery({
    queryKey: ['topDatasets', datasetKeys],
    queryFn: async ({ signal }) => {
      const results = await Promise.all(
        datasetKeys.map((datasetKey) =>
          fetchDatasetMetadata({ datasetKey, signal }),
        ),
      )
      return results
    },
    enabled: datasetKeys.length > 0,
    staleTime: 1000 * 60 * 60,
  })

  const datasetSummaries = useMemo<DatasetSummary[]>(() => {
    return (
      datasetQuery.data
        ?.map((dataset) => ({
          key: dataset.key,
          title: dataset.title,
          occurrenceCount: datasetCountsByKey[dataset.key] ?? 0,
          doi: dataset.doi,
          publisher: dataset.publisher,
          license: dataset.license,
        }))
        .filter((dataset) => dataset.title) ?? []
    )
  }, [datasetQuery.data, datasetCountsByKey])

  const totalRecords = facetsQuery.data?.count ?? 0

  const summary = useMemo<LensSummary>(
    () => ({
      seasonalityData,
      yearSummary,
      kingdomBreakdown,
      datasetSummaries,
      totalRecords,
      maxSeasonality: Math.max(...seasonalityData, 1),
      recordsBreakdown: buildRecordsBreakdown(facetsSummary?.basisOfRecord ?? [], totalRecords),
    }),
    [seasonalityData, yearSummary, kingdomBreakdown, datasetSummaries, totalRecords, facetsSummary],
  )

  const {
    signatureSpeciesData,
    isReady: isSignatureReady,
  } = useLiveSignatureSpecies(activePlace, commonNameLanguage)

  const isFacetsReady =
    !activePlace || facetsQuery.isSuccess || facetsQuery.isError
  const isTaxonLabelsReady =
    kingdomKeys.length === 0 || taxonLabelsQuery.isSuccess || taxonLabelsQuery.isError
  const isDatasetsReady =
    datasetKeys.length === 0 || datasetQuery.isSuccess || datasetQuery.isError

  const isReady =
    enabled &&
    isFacetsReady &&
    top.isReady &&
    thematic.isReady &&
    conservation.isReady &&
    isTaxonLabelsReady &&
    isDatasetsReady &&
    isSignatureReady

  return useMemo(
    () => ({
      isReady,
      placeId: activePlace?.id ?? 'none',
      summary,
      top,
      thematic,
      conservation,
      signatureSpeciesData,
    }),
    [isReady, activePlace?.id, summary, top, thematic, conservation, signatureSpeciesData],
  )
}
