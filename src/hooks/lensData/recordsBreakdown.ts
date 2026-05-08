import type { RecordsBreakdownItem } from './types'

const RECORD_TYPE_META: Record<string, { label: string; hint: string }> = {
  HUMAN_OBSERVATION: {
    label: 'Citizen-science sightings',
    hint: 'people with cameras, notebooks & apps',
  },
  OBSERVATION: {
    label: 'Field observations',
    hint: 'surveys without a physical voucher',
  },
  MACHINE_OBSERVATION: {
    label: 'Cameras & sensors',
    hint: 'camera traps, acoustic & DNA detectors',
  },
  PRESERVED_SPECIMEN: {
    label: 'Museum & herbarium specimens',
    hint: 'physical samples in scientific collections',
  },
  MATERIAL_SAMPLE: {
    label: 'Field samples',
    hint: 'environmental DNA, traps, nets',
  },
  MATERIAL_CITATION: {
    label: 'Published research records',
    hint: 'occurrences cited in scientific literature',
  },
  LIVING_SPECIMEN: {
    label: 'Living collections',
    hint: 'zoos, botanical gardens, gene banks',
  },
  FOSSIL_SPECIMEN: {
    label: 'Fossils',
    hint: 'preserved remains from deep time',
  },
  OCCURRENCE: {
    label: 'Other records',
    hint: 'unspecified record type',
  },
}

type BasisOfRecordCount = {
  name: string
  count: number
}

export const buildRecordsBreakdown = (
  counts: BasisOfRecordCount[],
  totalRecords: number,
): RecordsBreakdownItem[] => {
  if (!counts.length || totalRecords === 0) return []

  return counts.map((item) => {
    const meta = RECORD_TYPE_META[item.name] ?? { label: item.name, hint: '' }
    return {
      key: item.name,
      label: meta.label,
      hint: meta.hint,
      count: item.count,
      share: item.count / totalRecords,
    }
  })
}