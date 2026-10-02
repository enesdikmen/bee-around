import type {
  BreakdownItem,
  ConservationSnapshot,
  DatasetSummary,
  SpeciesCard,
  ThematicStripCard,
} from '../../types/lens'
import type { SignatureSpeciesCard } from './signatureSpecies'

export type RecordsBreakdownItem = {
  key: string
  label: string
  hint: string
  count: number
  share: number
}

export type YearCount = { year: number; count: number }

export type YearSummary = {
  firstYear: number
  peakYear: number
  peakYearCount: number
  /** Per-year observation counts, sorted chronologically. */
  yearCounts: YearCount[]
}

/** Place-level summary. The same for every poster seed. */
export type LensSummary = {
  seasonalityData: number[]
  yearSummary: YearSummary | null
  kingdomBreakdown: BreakdownItem[]
  datasetSummaries: DatasetSummary[]
  totalRecords: number
  maxSeasonality: number
  recordsBreakdown: RecordsBreakdownItem[]
}

/** Everything one poster shows: the summary plus the species picked for a seed. */
export type LensData = LensSummary & {
  topSpeciesData: SpeciesCard[]
  thematicStripCards: ThematicStripCard[]
  conservationSnapshot: ConservationSnapshot
  /** Live-computed signature species (over-represented vs global baseline).
   *  A small pool (after cross-lens dedupe) of candidates ranked by
   *  `localShare / globalShare`. The signature-species card picks one at
   *  random from this list. Empty while loading, undersampled, or
   *  fully claimed by higher-priority lenses. */
  signatureSpeciesData: SignatureSpeciesCard[]
}
