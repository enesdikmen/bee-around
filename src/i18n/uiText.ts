export const UI_LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'es', label: 'ES' },
  { code: 'tr', label: 'TR' },
  { code: 'de', label: 'DE' },
  { code: 'it', label: 'IT' },
  { code: 'pt', label: 'PT' },
] as const

export type UiLanguage = (typeof UI_LANGUAGES)[number]['code']

export type UiText = {
  toolbar: {
    appTagline: string
    displayOptions: string
    language: string
    languageAria: string
    theme: string
    about: string
    regenerate: string
    regenerateTitle: string
    share: string
    shareCopied: string
    shareTitle: string
    pdf: string
    pdfTitle: string
    lockCard: string
    unlockCard: string
    lockCardTitle: string
    unlockCardTitle: string
    loadingSnapshot: string
    loadingSnapshotSteps: string[]
  }
  citySearch: {
    placeholder: string
    pickCity: string
    ariaLabel: string
    searching: string
    failed: string
    noMatches: string
  }
  poster: {
    portraitTitle: string
    sightingsOnGbif: string
    iucnRedList: string
    doingWell: string
    watchList: string
    atRisk: string
    comparisonTitle: string
    cities: string
    countries: string
    comparedWith: (count: string, cohort: string) => string
    recordingIntensity: string
    threatenedShare: string
    percentile: (rank: number) => string
    percentileAria: (label: string, rank: number) => string
    mostObservedSpecies: string
    observations: (count: string) => string
    imageUnavailable: string
    imageUnavailableAria: (alt: string) => string
    speciesDetailsAria: (name: string) => string
    iucnTooltip: (label: string) => string
    signatureTooltip: (ratio: string) => string
    taxonLink: string
    photoBy: (author: string) => string
    photoSource: string
    photoSourceLabel: (label: string) => string
    thematicInfo: {
      inSeason: string
      smallWonders: string
      nightCreatures: string
    }
    seasonality: string
    recordsSince: (year: number) => string
    monthlyObservations: string
    peakYear: (year: number, count: string) => string
    inLastDecade: (percent: number) => string
    evidenceMix: string
    evidenceLabels: Record<string, string>
    otherSources: (count: number) => string
    atRiskRibbon: (category: string) => string
    signatureRibbon: (ratio: string) => string
    sources: string
    sourcesAttributionAria: string
    sourcesDataNote: string
    sourcesTopDatasets: string
    sourcesMatchingRecords: (count: string) => string
    sourcesPublisher: string
    sourcesLicense: string
    sourcesReuseNote: string
    openGbifDatasets: string
    printFooter: string
    dataFrom: string
    scanQr: string
    thematic: {
      inSeason: (month: string) => string
      smallWonder: string
      nightCreature: string
    }
  }
}

export const DEFAULT_UI_LANGUAGE: UiLanguage = 'en'

export const normalizeUiLanguage = (language?: string | null): UiLanguage => {
  const normalized = (language ?? '').trim().toLowerCase()
  return UI_LANGUAGES.some((option) => option.code === normalized)
    ? (normalized as UiLanguage)
    : DEFAULT_UI_LANGUAGE
}

const englishText: UiText = {
  toolbar: {
    appTagline: 'Biodiversity portraits',
    displayOptions: 'Display options',
    language: 'Language',
    languageAria: 'Common names language',
    theme: 'Theme',
    about: 'About / Method',
    regenerate: 'Regenerate',
    regenerateTitle: 'Regenerate layout and data',
    share: 'Share',
    shareCopied: 'Link copied',
    shareTitle: 'Copy a shareable link to this exact poster',
    pdf: 'PDF',
    pdfTitle: "Open the browser print dialog - choose 'Save as PDF'",
    lockCard: 'Lock card',
    unlockCard: 'Unlock card',
    lockCardTitle: 'Lock card content and position',
    unlockCardTitle: 'Unlock card',
    loadingSnapshot: 'Loading full place snapshot...',
    loadingSnapshotSteps: ['Taking off', 'Finding your place', 'Landing the snapshot'],
  },
  citySearch: {
    placeholder: 'Search a city...',
    pickCity: 'Pick a city',
    ariaLabel: 'Search a city',
    searching: 'Searching...',
    failed: 'Search failed',
    noMatches: 'No matches',
  },
  poster: {
    portraitTitle: 'Biodiversity Portrait',
    sightingsOnGbif: 'Sightings on GBIF',
    iucnRedList: 'IUCN Red List',
    doingWell: 'Doing well',
    watchList: 'Watch list',
    atRisk: 'At risk',
    comparisonTitle: 'How this place compares',
    cities: 'cities',
    countries: 'countries',
    comparedWith: (count, cohort) => `vs ${count} ${cohort}`,
    recordingIntensity: 'Recording intensity',
    threatenedShare: 'Threatened share',
    percentile: (rank) => `Above ${rank}%`,
    percentileAria: (label, rank) => `${label} is above ${rank}% of similar places`,
    mostObservedSpecies: 'Most observed species',
    observations: (count) => `${count} observations`,
    imageUnavailable: 'Image unavailable',
    imageUnavailableAria: (alt) => `${alt} image unavailable`,
    speciesDetailsAria: (name) => `${name} details`,
    iucnTooltip: (label) => `IUCN: ${label}`,
    signatureTooltip: (ratio) => `Signature species: ${ratio} more represented here`,
    taxonLink: 'View taxon on GBIF',
    photoBy: (author) => `Photo: ${author}`,
    photoSource: 'Photo source',
    photoSourceLabel: (label) => `Photo source: ${label}`,
    thematicInfo: {
      inSeason: 'Picked for this month',
      smallWonders: 'Picked from tiny taxa',
      nightCreatures: 'Picked from nocturnal taxa',
    },
    seasonality: 'Seasonality',
    recordsSince: (year) => `Records since ${year}`,
    monthlyObservations: 'Monthly observations',
    peakYear: (year, count) => `Peak ${year}: ${count} obs`,
    inLastDecade: (percent) => `${percent}% in last decade`,
    evidenceMix: 'Evidence mix',
    evidenceLabels: {
      HUMAN_OBSERVATION: 'Citizen science',
      PRESERVED_SPECIMEN: 'Museum + herbarium',
      MATERIAL_SAMPLE: 'Field samples',
      MACHINE_OBSERVATION: 'Cameras + sensors',
      OBSERVATION: 'Field observation',
    },
    otherSources: (count) => `${count} other source${count === 1 ? '' : 's'}`,
    atRiskRibbon: (category) => `At risk - ${category}`,
    signatureRibbon: (ratio) => `Signature - ${ratio}`,
    sources: 'Sources',
    sourcesAttributionAria: 'Attribution details',
    sourcesDataNote:
      'Occurrence records, taxon names, counts, IUCN categories, evidence mix, seasonality, and top dataset metadata come from GBIF.',
    sourcesTopDatasets: 'Top contributing datasets',
    sourcesMatchingRecords: (count) => `${count} matching records`,
    sourcesPublisher: 'Publisher',
    sourcesLicense: 'License',
    sourcesReuseNote:
      'Search/place boundaries use OpenStreetMap Nominatim. The QR code reopens this Bee Around view; for formal reuse, review the linked GBIF dataset pages.',
    openGbifDatasets: 'Open GBIF datasets page',
    printFooter:
      'Occurrence records, taxon names, counts, conservation signals, and top dataset metadata come from GBIF. Place search and boundaries use OpenStreetMap Nominatim. Scan the QR code or open this Bee Around view for dataset links, licenses, DOI details, and full attribution.',
    dataFrom: 'Data from',
    scanQr: 'Scan to open this poster',
    thematic: {
      inSeason: (month) => `In season - ${month}`,
      smallWonder: 'Small wonder',
      nightCreature: 'Night creature',
    },
  },
}

const frenchText: UiText = {
  toolbar: {
    appTagline: 'Portraits de biodiversité',
    displayOptions: "Options d'affichage",
    language: 'Langue',
    languageAria: 'Langue des noms communs',
    theme: 'Thème',
    about: 'À propos / Méthode',
    regenerate: 'Régénérer',
    regenerateTitle: 'Régénérer la mise en page et les données',
    share: 'Partager',
    shareCopied: 'Lien copié',
    shareTitle: 'Copier un lien partageable vers cette affiche',
    pdf: 'PDF',
    pdfTitle: "Ouvrir la boîte de dialogue d'impression - choisir 'Enregistrer au format PDF'",
    lockCard: 'Verrouiller la carte',
    unlockCard: 'Déverrouiller la carte',
    lockCardTitle: 'Verrouiller le contenu et la position de la carte',
    unlockCardTitle: 'Déverrouiller la carte',
    loadingSnapshot: 'Chargement complet du lieu...',
    loadingSnapshotSteps: ['Décollage', 'Recherche du lieu', 'Atterrissage du portrait'],
  },
  citySearch: {
    placeholder: 'Rechercher une ville...',
    pickCity: 'Choisir une ville',
    ariaLabel: 'Rechercher une ville',
    searching: 'Recherche...',
    failed: 'Échec de la recherche',
    noMatches: 'Aucun résultat',
  },
  poster: {
    portraitTitle: 'Portrait de biodiversité',
    sightingsOnGbif: 'Observations sur GBIF',
    iucnRedList: "Liste rouge de l'IUCN",
    doingWell: 'En bon état',
    watchList: 'A surveiller',
    atRisk: 'Menacé',
    comparisonTitle: 'Comparaison de ce lieu',
    cities: 'villes',
    countries: 'pays',
    comparedWith: (count, cohort) => `vs ${count} ${cohort}`,
    recordingIntensity: 'Intensité de collecte',
    threatenedShare: 'Part menacée',
    percentile: (rank) => `Au-dessus ${rank}%`,
    percentileAria: (label, rank) => `${label} est au-dessus de ${rank}% des lieux similaires`,
    mostObservedSpecies: 'Espèce la plus observée',
    observations: (count) => `${count} observations`,
    imageUnavailable: 'Image indisponible',
    imageUnavailableAria: (alt) => `Image indisponible pour ${alt}`,
    speciesDetailsAria: (name) => `Détails de ${name}`,
    iucnTooltip: (label) => `IUCN : ${label}`,
    signatureTooltip: (ratio) => `Espèce signature : ${ratio} plus représentée ici`,
    taxonLink: 'Voir le taxon sur GBIF',
    photoBy: (author) => `Photo : ${author}`,
    photoSource: 'Source de la photo',
    photoSourceLabel: (label) => `Source de la photo : ${label}`,
    thematicInfo: {
      inSeason: 'Choisie pour ce mois',
      smallWonders: 'Choisie parmi les petits taxons',
      nightCreatures: 'Choisie parmi les taxons nocturnes',
    },
    seasonality: 'Saisonnalité',
    recordsSince: (year) => `Données depuis ${year}`,
    monthlyObservations: 'Observations mensuelles',
    peakYear: (year, count) => `Pic ${year}: ${count} obs`,
    inLastDecade: (percent) => `${percent}% sur la dernière décennie`,
    evidenceMix: 'Types de preuves',
    evidenceLabels: {
      HUMAN_OBSERVATION: 'Science participative',
      PRESERVED_SPECIMEN: 'Musée + herbier',
      MATERIAL_SAMPLE: 'Échantillons de terrain',
      MACHINE_OBSERVATION: 'Caméras + capteurs',
      OBSERVATION: 'Observation de terrain',
    },
    otherSources: (count) => `${count} autre source${count === 1 ? '' : 's'}`,
    atRiskRibbon: (category) => `Menacé - ${category}`,
    signatureRibbon: (ratio) => `Signature - ${ratio}`,
    sources: 'Sources',
    sourcesAttributionAria: "Détails d'attribution",
    sourcesDataNote:
      "Les occurrences, noms de taxons, totaux, catégories IUCN, types de preuves, saisonnalité et métadonnées des principaux jeux de données proviennent de GBIF.",
    sourcesTopDatasets: 'Principaux jeux de données contributeurs',
    sourcesMatchingRecords: (count) => `${count} données correspondantes`,
    sourcesPublisher: 'Éditeur',
    sourcesLicense: 'Licence',
    sourcesReuseNote:
      "Les limites de recherche et de lieu utilisent OpenStreetMap Nominatim. Le code QR rouvre cette vue Bee Around ; pour une réutilisation formelle, consultez les pages GBIF des jeux de données liés.",
    openGbifDatasets: 'Ouvrir la page des jeux de données GBIF',
    printFooter:
      "Les occurrences, noms de taxons, totaux, signaux de conservation et métadonnées des principaux jeux de données proviennent de GBIF. La recherche de lieu et les limites utilisent OpenStreetMap Nominatim. Scannez le code QR ou ouvrez cette vue Bee Around pour les liens vers les jeux de données, les licences, les DOI et l'attribution complète.",
    dataFrom: 'Données de',
    scanQr: 'Scanner pour ouvrir cette affiche',
    thematic: {
      inSeason: (month) => `De saison - ${month}`,
      smallWonder: 'Petite merveille',
      nightCreature: 'Créature nocturne',
    },
  },
}

const spanishText: UiText = {
  toolbar: {
    appTagline: 'Retratos de biodiversidad',
    displayOptions: 'Opciones de visualización',
    language: 'Idioma',
    languageAria: 'Idioma de los nombres comunes',
    theme: 'Tema',
    about: 'Acerca de / Método',
    regenerate: 'Regenerar',
    regenerateTitle: 'Regenerar diseño y datos',
    share: 'Compartir',
    shareCopied: 'Enlace copiado',
    shareTitle: 'Copiar un enlace compartible a este póster',
    pdf: 'PDF',
    pdfTitle: "Abrir el diálogo de impresión - elegir 'Guardar como PDF'",
    lockCard: 'Bloquear tarjeta',
    unlockCard: 'Desbloquear tarjeta',
    lockCardTitle: 'Bloquear contenido y posición de la tarjeta',
    unlockCardTitle: 'Desbloquear tarjeta',
    loadingSnapshot: 'Cargando instantánea completa del lugar...',
    loadingSnapshotSteps: ['Despegando', 'Buscando el lugar', 'Aterrizando el retrato'],
  },
  citySearch: {
    placeholder: 'Buscar una ciudad...',
    pickCity: 'Elegir una ciudad',
    ariaLabel: 'Buscar una ciudad',
    searching: 'Buscando...',
    failed: 'La búsqueda falló',
    noMatches: 'Sin resultados',
  },
  poster: {
    portraitTitle: 'Retrato de biodiversidad',
    sightingsOnGbif: 'Observaciones en GBIF',
    iucnRedList: 'Lista Roja de la IUCN',
    doingWell: 'En buen estado',
    watchList: 'En seguimiento',
    atRisk: 'En riesgo',
    comparisonTitle: 'Comparación de este lugar',
    cities: 'ciudades',
    countries: 'países',
    comparedWith: (count, cohort) => `frente a ${count} ${cohort}`,
    recordingIntensity: 'Intensidad de registro',
    threatenedShare: 'Proporción amenazada',
    percentile: (rank) => `Por encima ${rank}%`,
    percentileAria: (label, rank) => `${label} está por encima del ${rank}% de lugares similares`,
    mostObservedSpecies: 'Especie más observada',
    observations: (count) => `${count} observaciones`,
    imageUnavailable: 'Imagen no disponible',
    imageUnavailableAria: (alt) => `Imagen de ${alt} no disponible`,
    speciesDetailsAria: (name) => `Detalles de ${name}`,
    iucnTooltip: (label) => `IUCN: ${label}`,
    signatureTooltip: (ratio) => `Especie distintiva: ${ratio} más representada aquí`,
    taxonLink: 'Ver taxón en GBIF',
    photoBy: (author) => `Foto: ${author}`,
    photoSource: 'Fuente de la foto',
    photoSourceLabel: (label) => `Fuente de la foto: ${label}`,
    thematicInfo: {
      inSeason: 'Elegida para este mes',
      smallWonders: 'Elegida entre taxones pequeños',
      nightCreatures: 'Elegida entre taxones nocturnos',
    },
    seasonality: 'Estacionalidad',
    recordsSince: (year) => `Registros desde ${year}`,
    monthlyObservations: 'Observaciones mensuales',
    peakYear: (year, count) => `Pico ${year}: ${count} obs`,
    inLastDecade: (percent) => `${percent}% en la última década`,
    evidenceMix: 'Mezcla de evidencias',
    evidenceLabels: {
      HUMAN_OBSERVATION: 'Ciencia ciudadana',
      PRESERVED_SPECIMEN: 'Museo + herbario',
      MATERIAL_SAMPLE: 'Muestras de campo',
      MACHINE_OBSERVATION: 'Cámaras + sensores',
      OBSERVATION: 'Observación de campo',
    },
    otherSources: (count) => `${count} otra fuente${count === 1 ? '' : 's'}`,
    atRiskRibbon: (category) => `En riesgo - ${category}`,
    signatureRibbon: (ratio) => `Firma - ${ratio}`,
    sources: 'Fuentes',
    sourcesAttributionAria: 'Detalles de atribución',
    sourcesDataNote:
      'Los registros de ocurrencias, nombres de taxones, recuentos, categorías IUCN, mezcla de evidencias, estacionalidad y metadatos de los principales conjuntos de datos vienen de GBIF.',
    sourcesTopDatasets: 'Principales conjuntos de datos aportantes',
    sourcesMatchingRecords: (count) => `${count} registros coincidentes`,
    sourcesPublisher: 'Publicador',
    sourcesLicense: 'Licencia',
    sourcesReuseNote:
      'Los límites de búsqueda y lugar usan OpenStreetMap Nominatim. El código QR vuelve a abrir esta vista de Bee Around; para reutilización formal, revisa las páginas enlazadas de conjuntos de datos de GBIF.',
    openGbifDatasets: 'Abrir la página de datasets de GBIF',
    printFooter:
      'Los registros de ocurrencias, nombres de taxones, recuentos, señales de conservación y metadatos de los principales conjuntos de datos provienen de GBIF. La búsqueda de lugares y los límites usan OpenStreetMap Nominatim. Escanea el código QR o abre esta vista de Bee Around para enlaces de datasets, licencias, DOI y atribución completa.',
    dataFrom: 'Datos de',
    scanQr: 'Escanear para abrir este póster',
    thematic: {
      inSeason: (month) => `En temporada - ${month}`,
      smallWonder: 'Pequeña maravilla',
      nightCreature: 'Criatura nocturna',
    },
  },
}

const turkishText: UiText = {
  toolbar: {
    appTagline: 'Biyoçeşitlilik portreleri',
    displayOptions: 'Görünüm seçenekleri',
    language: 'Dil',
    languageAria: 'Yaygın ad dili',
    theme: 'Tema',
    about: 'Hakkında / Yöntem',
    regenerate: 'Yenile',
    regenerateTitle: 'Düzeni ve verileri yeniden oluştur',
    share: 'Paylaş',
    shareCopied: 'Bağlantı kopyalandı',
    shareTitle: 'Bu poster için paylaşılabilir bağlantıyı kopyala',
    pdf: 'PDF',
    pdfTitle: "Tarayıcı yazdırma penceresini aç - 'PDF olarak kaydet'i seç",
    lockCard: 'Kartı kilitle',
    unlockCard: 'Kart kilidini aç',
    lockCardTitle: 'Kart içeriğini ve konumunu kilitle',
    unlockCardTitle: 'Kart kilidini aç',
    loadingSnapshot: 'Tam yer anlık görüntüsü yükleniyor...',
    loadingSnapshotSteps: ['Havalanılıyor', 'Yer bulunuyor', 'Portreye iniliyor'],
  },
  citySearch: {
    placeholder: 'Şehir ara...',
    pickCity: 'Şehir seç',
    ariaLabel: 'Şehir ara',
    searching: 'Aranıyor...',
    failed: 'Arama başarısız',
    noMatches: 'Eşleşme yok',
  },
  poster: {
    portraitTitle: 'Biyoçeşitlilik Portresi',
    sightingsOnGbif: 'GBIF gözlemleri',
    iucnRedList: 'IUCN Kırmızı Liste',
    doingWell: 'İyi durumda',
    watchList: 'İzleme listesi',
    atRisk: 'Risk altında',
    comparisonTitle: 'Bu yerin karşılaştırması',
    cities: 'şehir',
    countries: 'ülke',
    comparedWith: (count, cohort) => `${count} ${cohort} ile karşılaştırma`,
    recordingIntensity: 'Kayıt yoğunluğu',
    threatenedShare: 'Tehdit altındaki pay',
    percentile: (rank) => `%${rank} üstünde`,
    percentileAria: (label, rank) => `${label}, benzer yerlerin %${rank} üstünde`,
    mostObservedSpecies: 'En çok gözlenen tür',
    observations: (count) => `${count} gözlem`,
    imageUnavailable: 'Görsel yok',
    imageUnavailableAria: (alt) => `${alt} görseli yok`,
    speciesDetailsAria: (name) => `${name} ayrıntıları`,
    iucnTooltip: (label) => `IUCN: ${label}`,
    signatureTooltip: (ratio) => `İmza tür: burada ${ratio} daha fazla temsil ediliyor`,
    taxonLink: "Taksonu GBIF'te gör",
    photoBy: (author) => `Fotoğraf: ${author}`,
    photoSource: 'Fotoğraf kaynağı',
    photoSourceLabel: (label) => `Fotoğraf kaynağı: ${label}`,
    thematicInfo: {
      inSeason: 'Bu ay için seçildi',
      smallWonders: 'Küçük taksonlardan seçildi',
      nightCreatures: 'Gececil taksonlardan seçildi',
    },
    seasonality: 'Mevsimsellik',
    recordsSince: (year) => `${year} yılından beri kayıtlar`,
    monthlyObservations: 'Aylık gözlemler',
    peakYear: (year, count) => `Zirve ${year}: ${count} gözlem`,
    inLastDecade: (percent) => `son on yılda %${percent}`,
    evidenceMix: 'Kanıt karışımı',
    evidenceLabels: {
      HUMAN_OBSERVATION: 'Vatandaş bilimi',
      PRESERVED_SPECIMEN: 'Müze + herbaryum',
      MATERIAL_SAMPLE: 'Saha örnekleri',
      MACHINE_OBSERVATION: 'Kameralar + sensörler',
      OBSERVATION: 'Saha gözlemi',
    },
    otherSources: (count) => `${count} diğer kaynak`,
    atRiskRibbon: (category) => `Risk altında - ${category}`,
    signatureRibbon: (ratio) => `İmza - ${ratio}`,
    sources: 'Kaynaklar',
    sourcesAttributionAria: 'Atıf ayrıntıları',
    sourcesDataNote:
      "Oluşum kayıtları, takson adları, sayılar, IUCN kategorileri, kanıt karışımı, mevsimsellik ve en önemli veri seti metadataları GBIF'ten gelir.",
    sourcesTopDatasets: 'En çok katkı veren veri setleri',
    sourcesMatchingRecords: (count) => `${count} eşleşen kayıt`,
    sourcesPublisher: 'Yayıncı',
    sourcesLicense: 'Lisans',
    sourcesReuseNote:
      'Arama/yer sınırları OpenStreetMap Nominatim kullanır. QR kodu bu Bee Around görünümünü yeniden açar; resmi yeniden kullanım için bağlantılı GBIF veri seti sayfalarını inceleyin.',
    openGbifDatasets: 'GBIF veri setleri sayfasını aç',
    printFooter:
      'Oluşum kayıtları, takson adları, sayılar, koruma sinyalleri ve en önemli veri seti metadataları GBIF kaynaklıdır. Yer araması ve sınırlar OpenStreetMap Nominatim kullanır. Veri seti bağlantıları, lisanslar, DOI ayrıntıları ve tam atıf için QR kodunu tarayın veya bu Bee Around görünümünü açın.',
    dataFrom: 'Veri kaynağı',
    scanQr: 'Bu posteri açmak için tara',
    thematic: {
      inSeason: (month) => `Sezonda - ${month}`,
      smallWonder: 'Küçük mucize',
      nightCreature: 'Gece canlısı',
    },
  },
}

const germanText: UiText = {
  toolbar: {
    appTagline: 'Biodiversitätsporträts',
    displayOptions: 'Anzeigeoptionen',
    language: 'Sprache',
    languageAria: 'Sprache der Trivialnamen',
    theme: 'Design',
    about: 'Info / Methode',
    regenerate: 'Neu generieren',
    regenerateTitle: 'Layout und Daten neu generieren',
    share: 'Teilen',
    shareCopied: 'Link kopiert',
    shareTitle: 'Teilbaren Link zu diesem Poster kopieren',
    pdf: 'PDF',
    pdfTitle: "Druckdialog des Browsers öffnen - 'Als PDF speichern' wählen",
    lockCard: 'Karte sperren',
    unlockCard: 'Karte entsperren',
    lockCardTitle: 'Inhalt und Position der Karte sperren',
    unlockCardTitle: 'Karte entsperren',
    loadingSnapshot: 'Vollständiger Orts-Snapshot wird geladen...',
    loadingSnapshotSteps: ['Abheben', 'Ort finden', 'Snapshot landen'],
  },
  citySearch: {
    placeholder: 'Stadt suchen...',
    pickCity: 'Stadt auswählen',
    ariaLabel: 'Stadt suchen',
    searching: 'Suche läuft...',
    failed: 'Suche fehlgeschlagen',
    noMatches: 'Keine Treffer',
  },
  poster: {
    portraitTitle: 'Biodiversitätsporträt',
    sightingsOnGbif: 'GBIF-Nachweise',
    iucnRedList: 'IUCN Rote Liste',
    doingWell: 'Ungefährdet',
    watchList: 'Beobachtungsliste',
    atRisk: 'Gefährdet',
    comparisonTitle: 'Vergleich dieses Ortes',
    cities: 'Städte',
    countries: 'Länder',
    comparedWith: (count, cohort) => `vs ${count} ${cohort}`,
    recordingIntensity: 'Erfassungsintensität',
    threatenedShare: 'Anteil gefährdeter Arten',
    percentile: (rank) => `Über ${rank}%`,
    percentileAria: (label, rank) => `${label} liegt über ${rank}% vergleichbarer Orte`,
    mostObservedSpecies: 'Am häufigsten beobachtete Art',
    observations: (count) => `${count} Beobachtungen`,
    imageUnavailable: 'Bild nicht verfügbar',
    imageUnavailableAria: (alt) => `${alt}: Bild nicht verfügbar`,
    speciesDetailsAria: (name) => `Details zu ${name}`,
    iucnTooltip: (label) => `IUCN: ${label}`,
    signatureTooltip: (ratio) => `Signaturart: hier ${ratio} stärker vertreten`,
    taxonLink: 'Taxon auf GBIF ansehen',
    photoBy: (author) => `Foto: ${author}`,
    photoSource: 'Fotoquelle',
    photoSourceLabel: (label) => `Fotoquelle: ${label}`,
    thematicInfo: {
      inSeason: 'Für diesen Monat ausgewählt',
      smallWonders: 'Aus kleinen Taxa ausgewählt',
      nightCreatures: 'Aus nachtaktiven Taxa ausgewählt',
    },
    seasonality: 'Saisonalität',
    recordsSince: (year) => `Nachweise seit ${year}`,
    monthlyObservations: 'Monatliche Beobachtungen',
    peakYear: (year, count) => `Höchstwert ${year}: ${count} Beob.`,
    inLastDecade: (percent) => `${percent}% im letzten Jahrzehnt`,
    evidenceMix: 'Evidenzmix',
    evidenceLabels: {
      HUMAN_OBSERVATION: 'Bürgerwissenschaft',
      PRESERVED_SPECIMEN: 'Museum + Herbarium',
      MATERIAL_SAMPLE: 'Feldproben',
      MACHINE_OBSERVATION: 'Kameras + Sensoren',
      OBSERVATION: 'Feldbeobachtung',
    },
    otherSources: (count) => `${count} weitere Quelle${count === 1 ? '' : 'n'}`,
    atRiskRibbon: (category) => `Gefährdet - ${category}`,
    signatureRibbon: (ratio) => `Signatur - ${ratio}`,
    sources: 'Quellen',
    sourcesAttributionAria: 'Attributionsdetails',
    sourcesDataNote:
      'Vorkommensnachweise, Taxonnamen, Zahlen, IUCN-Kategorien, Evidenzmix, Saisonalität und Metadaten der wichtigsten Datensätze stammen von GBIF.',
    sourcesTopDatasets: 'Wichtigste beitragende Datensätze',
    sourcesMatchingRecords: (count) => `${count} passende Nachweise`,
    sourcesPublisher: 'Herausgeber',
    sourcesLicense: 'Lizenz',
    sourcesReuseNote:
      'Such- und Ortsgrenzen nutzen OpenStreetMap Nominatim. Der QR-Code öffnet diese Bee Around Ansicht erneut; für formelle Wiederverwendung bitte die verlinkten GBIF-Datensatzseiten prüfen.',
    openGbifDatasets: 'GBIF-Datensatzseite öffnen',
    printFooter:
      'Vorkommensnachweise, Taxonnamen, Zahlen, Schutzsignale und Metadaten der wichtigsten Datensätze stammen von GBIF. Ortssuche und Grenzen nutzen OpenStreetMap Nominatim. Scannen Sie den QR-Code oder öffnen Sie diese Bee Around Ansicht für Datensatzlinks, Lizenzen, DOI-Details und vollständige Attribution.',
    dataFrom: 'Daten von',
    scanQr: 'Scannen, um dieses Poster zu öffnen',
    thematic: {
      inSeason: (month) => `Saison - ${month}`,
      smallWonder: 'Kleines Wunder',
      nightCreature: 'Nachtaktive Art',
    },
  },
}

const italianText: UiText = {
  toolbar: {
    appTagline: 'Ritratti della biodiversità',
    displayOptions: 'Opzioni di visualizzazione',
    language: 'Lingua',
    languageAria: 'Lingua dei nomi comuni',
    theme: 'Tema',
    about: 'Informazioni / Metodo',
    regenerate: 'Rigenera',
    regenerateTitle: 'Rigenera layout e dati',
    share: 'Condividi',
    shareCopied: 'Link copiato',
    shareTitle: 'Copia un link condivisibile a questo poster',
    pdf: 'PDF',
    pdfTitle: "Apri il dialogo di stampa - scegli 'Salva come PDF'",
    lockCard: 'Blocca scheda',
    unlockCard: 'Sblocca scheda',
    lockCardTitle: 'Blocca contenuto e posizione della scheda',
    unlockCardTitle: 'Sblocca scheda',
    loadingSnapshot: 'Caricamento snapshot completo del luogo...',
    loadingSnapshotSteps: ['Decollo', 'Cerco il luogo', 'Atterro il ritratto'],
  },
  citySearch: {
    placeholder: 'Cerca una città...',
    pickCity: 'Scegli una città',
    ariaLabel: 'Cerca una città',
    searching: 'Ricerca...',
    failed: 'Ricerca non riuscita',
    noMatches: 'Nessun risultato',
  },
  poster: {
    portraitTitle: 'Ritratto della biodiversità',
    sightingsOnGbif: 'Osservazioni su GBIF',
    iucnRedList: 'Lista Rossa IUCN',
    doingWell: 'In buono stato',
    watchList: 'Da monitorare',
    atRisk: 'A rischio',
    comparisonTitle: 'Confronto di questo luogo',
    cities: 'città',
    countries: 'paesi',
    comparedWith: (count, cohort) => `rispetto a ${count} ${cohort}`,
    recordingIntensity: 'Intensità di registrazione',
    threatenedShare: 'Quota minacciata',
    percentile: (rank) => `Sopra ${rank}%`,
    percentileAria: (label, rank) => `${label} è sopra il ${rank}% dei luoghi simili`,
    mostObservedSpecies: 'Specie più osservata',
    observations: (count) => `${count} osservazioni`,
    imageUnavailable: 'Immagine non disponibile',
    imageUnavailableAria: (alt) => `Immagine di ${alt} non disponibile`,
    speciesDetailsAria: (name) => `Dettagli di ${name}`,
    iucnTooltip: (label) => `IUCN: ${label}`,
    signatureTooltip: (ratio) => `Specie distintiva: ${ratio} più rappresentata qui`,
    taxonLink: 'Vedi taxon su GBIF',
    photoBy: (author) => `Foto: ${author}`,
    photoSource: 'Fonte foto',
    photoSourceLabel: (label) => `Fonte foto: ${label}`,
    thematicInfo: {
      inSeason: 'Scelta per questo mese',
      smallWonders: 'Scelta tra piccoli taxon',
      nightCreatures: 'Scelta tra taxon notturni',
    },
    seasonality: 'Stagionalità',
    recordsSince: (year) => `Dati dal ${year}`,
    monthlyObservations: 'Osservazioni mensili',
    peakYear: (year, count) => `Picco ${year}: ${count} oss.`,
    inLastDecade: (percent) => `${percent}% nell'ultimo decennio`,
    evidenceMix: 'Mix di evidenze',
    evidenceLabels: {
      HUMAN_OBSERVATION: 'Scienza partecipata',
      PRESERVED_SPECIMEN: 'Museo + erbario',
      MATERIAL_SAMPLE: 'Campioni sul campo',
      MACHINE_OBSERVATION: 'Fotocamere + sensori',
      OBSERVATION: 'Osservazione sul campo',
    },
    otherSources: (count) => `${count} ${count === 1 ? 'altra fonte' : 'altre fonti'}`,
    atRiskRibbon: (category) => `A rischio - ${category}`,
    signatureRibbon: (ratio) => `Firma - ${ratio}`,
    sources: 'Fonti',
    sourcesAttributionAria: 'Dettagli di attribuzione',
    sourcesDataNote:
      'Record di occorrenza, nomi dei taxon, conteggi, categorie IUCN, mix di evidenze, stagionalità e metadati dei principali dataset provengono da GBIF.',
    sourcesTopDatasets: 'Principali dataset contributori',
    sourcesMatchingRecords: (count) => `${count} record corrispondenti`,
    sourcesPublisher: 'Editore',
    sourcesLicense: 'Licenza',
    sourcesReuseNote:
      'I confini di ricerca e luogo usano OpenStreetMap Nominatim. Il codice QR riapre questa vista Bee Around; per il riuso formale, consulta le pagine GBIF dei dataset collegati.',
    openGbifDatasets: 'Apri la pagina dei dataset GBIF',
    printFooter:
      "Record di occorrenza, nomi dei taxon, conteggi, segnali di conservazione e metadati dei principali dataset provengono da GBIF. Ricerca dei luoghi e confini usano OpenStreetMap Nominatim. Scansiona il codice QR o apri questa vista Bee Around per link ai dataset, licenze, dettagli DOI e attribuzione completa.",
    dataFrom: 'Dati da',
    scanQr: 'Scansiona per aprire questo poster',
    thematic: {
      inSeason: (month) => `Di stagione - ${month}`,
      smallWonder: 'Piccola meraviglia',
      nightCreature: 'Creatura notturna',
    },
  },
}

const portugueseText: UiText = {
  toolbar: {
    appTagline: 'Retratos da biodiversidade',
    displayOptions: 'Opções de exibição',
    language: 'Idioma',
    languageAria: 'Idioma dos nomes comuns',
    theme: 'Tema',
    about: 'Sobre / Método',
    regenerate: 'Regenerar',
    regenerateTitle: 'Regenerar layout e dados',
    share: 'Compartilhar',
    shareCopied: 'Link copiado',
    shareTitle: 'Copiar um link compartilhável para este pôster',
    pdf: 'PDF',
    pdfTitle: "Abrir a caixa de diálogo de impressão - escolher 'Salvar como PDF'",
    lockCard: 'Bloquear cartão',
    unlockCard: 'Desbloquear cartão',
    lockCardTitle: 'Bloquear conteúdo e posição do cartão',
    unlockCardTitle: 'Desbloquear cartão',
    loadingSnapshot: 'Carregando instantâneo completo do lugar...',
    loadingSnapshotSteps: ['Decolando', 'Encontrando o lugar', 'Pousando o retrato'],
  },
  citySearch: {
    placeholder: 'Buscar uma cidade...',
    pickCity: 'Escolher uma cidade',
    ariaLabel: 'Buscar uma cidade',
    searching: 'Buscando...',
    failed: 'Busca falhou',
    noMatches: 'Sem resultados',
  },
  poster: {
    portraitTitle: 'Retrato da biodiversidade',
    sightingsOnGbif: 'Observações no GBIF',
    iucnRedList: 'Lista Vermelha da IUCN',
    doingWell: 'Em bom estado',
    watchList: 'Lista de atenção',
    atRisk: 'Em risco',
    comparisonTitle: 'Comparação deste lugar',
    cities: 'cidades',
    countries: 'países',
    comparedWith: (count, cohort) => `comparado com ${count} ${cohort}`,
    recordingIntensity: 'Intensidade de registro',
    threatenedShare: 'Proporção ameaçada',
    percentile: (rank) => `Acima ${rank}%`,
    percentileAria: (label, rank) => `${label} está acima de ${rank}% de lugares semelhantes`,
    mostObservedSpecies: 'Espécie mais observada',
    observations: (count) => `${count} observações`,
    imageUnavailable: 'Imagem indisponível',
    imageUnavailableAria: (alt) => `Imagem de ${alt} indisponível`,
    speciesDetailsAria: (name) => `Detalhes de ${name}`,
    iucnTooltip: (label) => `IUCN: ${label}`,
    signatureTooltip: (ratio) => `Espécie assinatura: ${ratio} mais representada aqui`,
    taxonLink: 'Ver táxon no GBIF',
    photoBy: (author) => `Foto: ${author}`,
    photoSource: 'Fonte da foto',
    photoSourceLabel: (label) => `Fonte da foto: ${label}`,
    thematicInfo: {
      inSeason: 'Escolhida para este mês',
      smallWonders: 'Escolhida entre táxons pequenos',
      nightCreatures: 'Escolhida entre táxons noturnos',
    },
    seasonality: 'Sazonalidade',
    recordsSince: (year) => `Registros desde ${year}`,
    monthlyObservations: 'Observações mensais',
    peakYear: (year, count) => `Pico ${year}: ${count} obs`,
    inLastDecade: (percent) => `${percent}% na última década`,
    evidenceMix: 'Mistura de evidências',
    evidenceLabels: {
      HUMAN_OBSERVATION: 'Ciência cidadã',
      PRESERVED_SPECIMEN: 'Museu + herbário',
      MATERIAL_SAMPLE: 'Amostras de campo',
      MACHINE_OBSERVATION: 'Câmeras + sensores',
      OBSERVATION: 'Observação de campo',
    },
    otherSources: (count) => `${count} outra fonte${count === 1 ? '' : 's'}`,
    atRiskRibbon: (category) => `Em risco - ${category}`,
    signatureRibbon: (ratio) => `Assinatura - ${ratio}`,
    sources: 'Fontes',
    sourcesAttributionAria: 'Detalhes de atribuição',
    sourcesDataNote:
      'Registros de ocorrência, nomes de táxons, contagens, categorias IUCN, mistura de evidências, sazonalidade e metadados dos principais conjuntos de dados vêm do GBIF.',
    sourcesTopDatasets: 'Principais conjuntos de dados contribuintes',
    sourcesMatchingRecords: (count) => `${count} registros correspondentes`,
    sourcesPublisher: 'Publicador',
    sourcesLicense: 'Licença',
    sourcesReuseNote:
      'Limites de busca e lugar usam OpenStreetMap Nominatim. O código QR reabre esta visualização Bee Around; para reutilização formal, revise as páginas vinculadas dos conjuntos de dados do GBIF.',
    openGbifDatasets: 'Abrir a página de conjuntos de dados do GBIF',
    printFooter:
      'Registros de ocorrência, nomes de táxons, contagens, sinais de conservação e metadados dos principais conjuntos de dados vêm do GBIF. Busca de lugar e limites usam OpenStreetMap Nominatim. Escaneie o código QR ou abra esta visualização Bee Around para links de conjuntos de dados, licenças, detalhes de DOI e atribuição completa.',
    dataFrom: 'Dados de',
    scanQr: 'Escaneie para abrir este pôster',
    thematic: {
      inSeason: (month) => `Na temporada - ${month}`,
      smallWonder: 'Pequena maravilha',
      nightCreature: 'Criatura noturna',
    },
  },
}

export const UI_TEXT: Record<UiLanguage, UiText> = {
  en: englishText,
  fr: frenchText,
  es: spanishText,
  tr: turkishText,
  de: germanText,
  it: italianText,
  pt: portugueseText,
}

export const getUiText = (language?: string | null): UiText =>
  UI_TEXT[normalizeUiLanguage(language)]
