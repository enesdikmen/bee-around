import type {
  BreakdownItem,
  ConservationSnapshot,
  Place,
} from '../types/lens'

export const places: Place[] = [
  {
    id: 'munich-de',
    label: 'Munich, DE',
    country: 'Germany',
    latitude: 48.137154,
    longitude: 11.576124,
    radiusKm: 35,
    bbox: {
      minLat: 48.0616244,
      maxLat: 48.2481162,
      minLon: 11.360777,
      maxLon: 11.7229099,
    },
  },
  {
    id: 'nairobi-ke',
    label: 'Nairobi, KE',
    country: 'Kenya',
    countryCode: 'KE',
    latitude: -1.302398,
    longitude: 36.8288509,
    radiusKm: 45,
    bbox: {
      minLat: -1.4448822,
      maxLat: -1.1606749,
      minLon: 36.6647016,
      maxLon: 37.1048735,
    },
  },
  {
    id: 'bogota-co',
    label: 'Bogotá, CO',
    country: 'Colombia',
    latitude: 4.711,
    longitude: -74.0721,
    radiusKm: 55,
  },
  {
    id: 'helsinki-fi',
    label: 'Helsinki, FI',
    country: 'Finland',
    latitude: 60.1699,
    longitude: 24.9384,
    radiusKm: 50,
  },
  {
    id: 'capetown-za',
    label: 'Cape Town, ZA',
    country: 'South Africa',
    latitude: -33.9249,
    longitude: 18.4241,
    radiusKm: 60,
  },
  {
    id: 'singapore-sg',
    label: 'Singapore, SG',
    country: 'Singapore',
    latitude: 1.3521,
    longitude: 103.8198,
    radiusKm: 35,
  },
  {
    id: 'bursa-tr',
    label: 'Bursa, TR',
    country: 'Turkey',
    latitude: 40.1825734,
    longitude: 29.0675039,
    radiusKm: 45,
  },
  {
    id: 'alicante-es',
    label: 'Alicante, ES',
    country: 'Spain',
    latitude: 38.3436365,
    longitude: -0.4881708,
    radiusKm: 40,
  },
]

export const fallbackSeasonality: number[] = [
  18, 24, 32, 48, 68, 82, 74, 60, 44, 30, 22, 16,
]

export const fallbackKingdomBreakdown: BreakdownItem[] = [
  { label: 'Animalia', count: 14800 },
  { label: 'Plantae', count: 8200 },
  { label: 'Fungi', count: 1600 },
  { label: 'Chromista', count: 420 },
  { label: 'Bacteria', count: 210 },
]

export const IUCN_LABELS: Record<string, string> = {
  LC: 'Least concern',
  NT: 'Near threatened',
  VU: 'Vulnerable',
  EN: 'Endangered',
  CR: 'Critically endangered',
  DD: 'Data deficient',
  LEAST_CONCERN: 'Least concern',
  NEAR_THREATENED: 'Near threatened',
  VULNERABLE: 'Vulnerable',
  ENDANGERED: 'Endangered',
  CRITICALLY_ENDANGERED: 'Critically endangered',
  DATA_DEFICIENT: 'Data deficient',
  EXTINCT: 'Extinct',
  EXTINCT_IN_THE_WILD: 'Extinct in the wild',
}

export const fallbackConservationSnapshot: ConservationSnapshot = {
  totalAssessedSpecies: 248,
  threatenedCount: 31,
  threatenedPercent: 12.5,
  threatenedSpecies: [],
  categoryBreakdown: [
    { status: 'LC', label: 'Least concern', count: 182 },
    { status: 'NT', label: 'Near threatened', count: 26 },
    { status: 'VU', label: 'Vulnerable', count: 18 },
    { status: 'EN', label: 'Endangered', count: 9 },
    { status: 'CR', label: 'Critically endangered', count: 4 },
    { status: 'DD', label: 'Data deficient', count: 31 },
  ],
}
