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
    appTagline: 'Portraits de biodiversite',
    displayOptions: "Options d'affichage",
    language: 'Langue',
    languageAria: 'Langue des noms communs',
    theme: 'Theme',
    about: 'A propos / Methode',
    regenerate: 'Regenerer',
    regenerateTitle: 'Regenerer la mise en page et les donnees',
    share: 'Partager',
    shareCopied: 'Lien copie',
    shareTitle: 'Copier un lien partageable vers cette affiche',
    pdf: 'PDF',
    pdfTitle: "Ouvrir la boite de dialogue d'impression - choisir 'Enregistrer au format PDF'",
    lockCard: 'Verrouiller la carte',
    unlockCard: 'Deverrouiller la carte',
    lockCardTitle: 'Verrouiller le contenu et la position de la carte',
    unlockCardTitle: 'Deverrouiller la carte',
    loadingSnapshot: 'Chargement complet du lieu...',
    loadingSnapshotSteps: ['Decollage', 'Recherche du lieu', 'Atterrissage du portrait'],
  },
  citySearch: {
    placeholder: 'Rechercher une ville...',
    pickCity: 'Choisir une ville',
    ariaLabel: 'Rechercher une ville',
    searching: 'Recherche...',
    failed: 'Echec de la recherche',
    noMatches: 'Aucun resultat',
  },
  poster: {
    portraitTitle: 'Portrait de biodiversite',
    sightingsOnGbif: 'Observations sur GBIF',
    iucnRedList: "Liste rouge de l'IUCN",
    doingWell: 'En bon etat',
    watchList: 'A surveiller',
    atRisk: 'Menace',
    comparisonTitle: 'Comparaison de ce lieu',
    cities: 'villes',
    countries: 'pays',
    comparedWith: (count, cohort) => `vs ${count} ${cohort}`,
    recordingIntensity: 'Intensite de collecte',
    threatenedShare: 'Part menacee',
    percentile: (rank) => `Au-dessus ${rank}%`,
    percentileAria: (label, rank) => `${label} est au-dessus de ${rank}% des lieux similaires`,
    mostObservedSpecies: 'Espece la plus observee',
    observations: (count) => `${count} observations`,
    imageUnavailable: 'Image indisponible',
    imageUnavailableAria: (alt) => `Image indisponible pour ${alt}`,
    speciesDetailsAria: (name) => `Details de ${name}`,
    iucnTooltip: (label) => `IUCN : ${label}`,
    signatureTooltip: (ratio) => `Espece signature : ${ratio} plus representee ici`,
    taxonLink: 'Voir le taxon sur GBIF',
    photoBy: (author) => `Photo : ${author}`,
    photoSource: 'Source de la photo',
    photoSourceLabel: (label) => `Source de la photo : ${label}`,
    thematicInfo: {
      inSeason: 'Choisie pour ce mois',
      smallWonders: 'Choisie parmi les petits taxons',
      nightCreatures: 'Choisie parmi les taxons nocturnes',
    },
    seasonality: 'Saisonnalite',
    recordsSince: (year) => `Donnees depuis ${year}`,
    monthlyObservations: 'Observations mensuelles',
    peakYear: (year, count) => `Pic ${year}: ${count} obs`,
    inLastDecade: (percent) => `${percent}% sur la derniere decennie`,
    evidenceMix: 'Types de preuves',
    evidenceLabels: {
      HUMAN_OBSERVATION: 'Science participative',
      PRESERVED_SPECIMEN: 'Musee + herbier',
      MATERIAL_SAMPLE: 'Echantillons de terrain',
      MACHINE_OBSERVATION: 'Cameras + capteurs',
      OBSERVATION: 'Observation de terrain',
    },
    otherSources: (count) => `${count} autre source${count === 1 ? '' : 's'}`,
    atRiskRibbon: (category) => `Menace - ${category}`,
    signatureRibbon: (ratio) => `Signature - ${ratio}`,
    sources: 'Sources',
    sourcesAttributionAria: "Details d'attribution",
    sourcesDataNote:
      "Les occurrences, noms de taxons, totaux, categories IUCN, types de preuves, saisonnalite et metadonnees des principaux jeux de donnees proviennent de GBIF.",
    sourcesTopDatasets: 'Principaux jeux de donnees contributeurs',
    sourcesMatchingRecords: (count) => `${count} donnees correspondantes`,
    sourcesPublisher: 'Editeur',
    sourcesLicense: 'Licence',
    sourcesReuseNote:
      "Les limites de recherche et de lieu utilisent OpenStreetMap Nominatim. Le code QR rouvre cette vue Bee Around ; pour une reutilisation formelle, consultez les pages GBIF des jeux de donnees lies.",
    openGbifDatasets: 'Ouvrir la page des jeux de donnees GBIF',
    printFooter:
      "Les occurrences, noms de taxons, totaux, signaux de conservation et metadonnees des principaux jeux de donnees proviennent de GBIF. La recherche de lieu et les limites utilisent OpenStreetMap Nominatim. Scannez le code QR ou ouvrez cette vue Bee Around pour les liens vers les jeux de donnees, les licences, les DOI et l'attribution complete.",
    dataFrom: 'Donnees de',
    scanQr: 'Scanner pour ouvrir cette affiche',
    thematic: {
      inSeason: (month) => `De saison - ${month}`,
      smallWonder: 'Petite merveille',
      nightCreature: 'Creature nocturne',
    },
  },
}

const spanishText: UiText = {
  toolbar: {
    appTagline: 'Retratos de biodiversidad',
    displayOptions: 'Opciones de visualizacion',
    language: 'Idioma',
    languageAria: 'Idioma de los nombres comunes',
    theme: 'Tema',
    about: 'Acerca de / Metodo',
    regenerate: 'Regenerar',
    regenerateTitle: 'Regenerar diseno y datos',
    share: 'Compartir',
    shareCopied: 'Enlace copiado',
    shareTitle: 'Copiar un enlace compartible a este poster',
    pdf: 'PDF',
    pdfTitle: "Abrir el dialogo de impresion - elegir 'Guardar como PDF'",
    lockCard: 'Bloquear tarjeta',
    unlockCard: 'Desbloquear tarjeta',
    lockCardTitle: 'Bloquear contenido y posicion de la tarjeta',
    unlockCardTitle: 'Desbloquear tarjeta',
    loadingSnapshot: 'Cargando instantanea completa del lugar...',
    loadingSnapshotSteps: ['Despegando', 'Buscando el lugar', 'Aterrizando el retrato'],
  },
  citySearch: {
    placeholder: 'Buscar una ciudad...',
    pickCity: 'Elegir una ciudad',
    ariaLabel: 'Buscar una ciudad',
    searching: 'Buscando...',
    failed: 'La busqueda fallo',
    noMatches: 'Sin resultados',
  },
  poster: {
    portraitTitle: 'Retrato de biodiversidad',
    sightingsOnGbif: 'Observaciones en GBIF',
    iucnRedList: 'Lista Roja de la IUCN',
    doingWell: 'En buen estado',
    watchList: 'En seguimiento',
    atRisk: 'En riesgo',
    comparisonTitle: 'Comparacion de este lugar',
    cities: 'ciudades',
    countries: 'paises',
    comparedWith: (count, cohort) => `frente a ${count} ${cohort}`,
    recordingIntensity: 'Intensidad de registro',
    threatenedShare: 'Proporcion amenazada',
    percentile: (rank) => `Por encima ${rank}%`,
    percentileAria: (label, rank) => `${label} esta por encima del ${rank}% de lugares similares`,
    mostObservedSpecies: 'Especie mas observada',
    observations: (count) => `${count} observaciones`,
    imageUnavailable: 'Imagen no disponible',
    imageUnavailableAria: (alt) => `Imagen de ${alt} no disponible`,
    speciesDetailsAria: (name) => `Detalles de ${name}`,
    iucnTooltip: (label) => `IUCN: ${label}`,
    signatureTooltip: (ratio) => `Especie distintiva: ${ratio} mas representada aqui`,
    taxonLink: 'Ver taxon en GBIF',
    photoBy: (author) => `Foto: ${author}`,
    photoSource: 'Fuente de la foto',
    photoSourceLabel: (label) => `Fuente de la foto: ${label}`,
    thematicInfo: {
      inSeason: 'Elegida para este mes',
      smallWonders: 'Elegida entre taxones pequenos',
      nightCreatures: 'Elegida entre taxones nocturnos',
    },
    seasonality: 'Estacionalidad',
    recordsSince: (year) => `Registros desde ${year}`,
    monthlyObservations: 'Observaciones mensuales',
    peakYear: (year, count) => `Pico ${year}: ${count} obs`,
    inLastDecade: (percent) => `${percent}% en la ultima decada`,
    evidenceMix: 'Mezcla de evidencias',
    evidenceLabels: {
      HUMAN_OBSERVATION: 'Ciencia ciudadana',
      PRESERVED_SPECIMEN: 'Museo + herbario',
      MATERIAL_SAMPLE: 'Muestras de campo',
      MACHINE_OBSERVATION: 'Camaras + sensores',
      OBSERVATION: 'Observacion de campo',
    },
    otherSources: (count) => `${count} otra fuente${count === 1 ? '' : 's'}`,
    atRiskRibbon: (category) => `En riesgo - ${category}`,
    signatureRibbon: (ratio) => `Firma - ${ratio}`,
    sources: 'Fuentes',
    sourcesAttributionAria: 'Detalles de atribucion',
    sourcesDataNote:
      'Los registros de ocurrencias, nombres de taxones, recuentos, categorias IUCN, mezcla de evidencias, estacionalidad y metadatos de los principales conjuntos de datos vienen de GBIF.',
    sourcesTopDatasets: 'Principales conjuntos de datos aportantes',
    sourcesMatchingRecords: (count) => `${count} registros coincidentes`,
    sourcesPublisher: 'Publicador',
    sourcesLicense: 'Licencia',
    sourcesReuseNote:
      'Los limites de busqueda y lugar usan OpenStreetMap Nominatim. El codigo QR vuelve a abrir esta vista de Bee Around; para reutilizacion formal, revisa las paginas enlazadas de conjuntos de datos de GBIF.',
    openGbifDatasets: 'Abrir la pagina de datasets de GBIF',
    printFooter:
      'Los registros de ocurrencias, nombres de taxones, recuentos, senales de conservacion y metadatos de los principales conjuntos de datos provienen de GBIF. La busqueda de lugares y los limites usan OpenStreetMap Nominatim. Escanea el codigo QR o abre esta vista de Bee Around para enlaces de datasets, licencias, DOI y atribucion completa.',
    dataFrom: 'Datos de',
    scanQr: 'Escanear para abrir este poster',
    thematic: {
      inSeason: (month) => `En temporada - ${month}`,
      smallWonder: 'Pequena maravilla',
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
    appTagline: 'Biodiversitatsportrats',
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
    pdfTitle: "Druckdialog des Browsers offnen - 'Als PDF speichern' wahlen",
    lockCard: 'Karte sperren',
    unlockCard: 'Karte entsperren',
    lockCardTitle: 'Inhalt und Position der Karte sperren',
    unlockCardTitle: 'Karte entsperren',
    loadingSnapshot: 'Vollstandiger Orts-Snapshot wird geladen...',
    loadingSnapshotSteps: ['Abheben', 'Ort finden', 'Snapshot landen'],
  },
  citySearch: {
    placeholder: 'Stadt suchen...',
    pickCity: 'Stadt auswahlen',
    ariaLabel: 'Stadt suchen',
    searching: 'Suche lauft...',
    failed: 'Suche fehlgeschlagen',
    noMatches: 'Keine Treffer',
  },
  poster: {
    portraitTitle: 'Biodiversitatsportrat',
    sightingsOnGbif: 'GBIF-Nachweise',
    iucnRedList: 'IUCN Rote Liste',
    doingWell: 'Ungefahrdet',
    watchList: 'Beobachtungsliste',
    atRisk: 'Gefahrdet',
    comparisonTitle: 'Vergleich dieses Ortes',
    cities: 'Stadte',
    countries: 'Lander',
    comparedWith: (count, cohort) => `vs ${count} ${cohort}`,
    recordingIntensity: 'Erfassungsintensitat',
    threatenedShare: 'Anteil gefahrdeter Arten',
    percentile: (rank) => `Uber ${rank}%`,
    percentileAria: (label, rank) => `${label} liegt uber ${rank}% vergleichbarer Orte`,
    mostObservedSpecies: 'Am haufigsten beobachtete Art',
    observations: (count) => `${count} Beobachtungen`,
    imageUnavailable: 'Bild nicht verfugbar',
    imageUnavailableAria: (alt) => `${alt}: Bild nicht verfugbar`,
    speciesDetailsAria: (name) => `Details zu ${name}`,
    iucnTooltip: (label) => `IUCN: ${label}`,
    signatureTooltip: (ratio) => `Signaturart: hier ${ratio} starker vertreten`,
    taxonLink: 'Taxon auf GBIF ansehen',
    photoBy: (author) => `Foto: ${author}`,
    photoSource: 'Fotoquelle',
    photoSourceLabel: (label) => `Fotoquelle: ${label}`,
    thematicInfo: {
      inSeason: 'Fur diesen Monat ausgewahlt',
      smallWonders: 'Aus kleinen Taxa ausgewahlt',
      nightCreatures: 'Aus nachtaktiven Taxa ausgewahlt',
    },
    seasonality: 'Saisonalitat',
    recordsSince: (year) => `Nachweise seit ${year}`,
    monthlyObservations: 'Monatliche Beobachtungen',
    peakYear: (year, count) => `Hochstwert ${year}: ${count} Beob.`,
    inLastDecade: (percent) => `${percent}% im letzten Jahrzehnt`,
    evidenceMix: 'Evidenzmix',
    evidenceLabels: {
      HUMAN_OBSERVATION: 'Burgerwissenschaft',
      PRESERVED_SPECIMEN: 'Museum + Herbarium',
      MATERIAL_SAMPLE: 'Feldproben',
      MACHINE_OBSERVATION: 'Kameras + Sensoren',
      OBSERVATION: 'Feldbeobachtung',
    },
    otherSources: (count) => `${count} weitere Quelle${count === 1 ? '' : 'n'}`,
    atRiskRibbon: (category) => `Gefahrdet - ${category}`,
    signatureRibbon: (ratio) => `Signatur - ${ratio}`,
    sources: 'Quellen',
    sourcesAttributionAria: 'Attributionsdetails',
    sourcesDataNote:
      'Vorkommensnachweise, Taxonnamen, Zahlen, IUCN-Kategorien, Evidenzmix, Saisonalitat und Metadaten der wichtigsten Datensatze stammen von GBIF.',
    sourcesTopDatasets: 'Wichtigste beitragende Datensatze',
    sourcesMatchingRecords: (count) => `${count} passende Nachweise`,
    sourcesPublisher: 'Herausgeber',
    sourcesLicense: 'Lizenz',
    sourcesReuseNote:
      'Such- und Ortsgrenzen nutzen OpenStreetMap Nominatim. Der QR-Code offnet diese Bee Around Ansicht erneut; fur formelle Wiederverwendung bitte die verlinkten GBIF-Datensatzseiten prufen.',
    openGbifDatasets: 'GBIF-Datensatzseite offnen',
    printFooter:
      'Vorkommensnachweise, Taxonnamen, Zahlen, Schutzsignale und Metadaten der wichtigsten Datensatze stammen von GBIF. Ortssuche und Grenzen nutzen OpenStreetMap Nominatim. Scannen Sie den QR-Code oder offnen Sie diese Bee Around Ansicht fur Datensatzlinks, Lizenzen, DOI-Details und vollstandige Attribution.',
    dataFrom: 'Daten von',
    scanQr: 'Scannen, um dieses Poster zu offnen',
    thematic: {
      inSeason: (month) => `Saison - ${month}`,
      smallWonder: 'Kleines Wunder',
      nightCreature: 'Nachtaktive Art',
    },
  },
}

const italianText: UiText = {
  toolbar: {
    appTagline: 'Ritratti della biodiversita',
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
    placeholder: 'Cerca una citta...',
    pickCity: 'Scegli una citta',
    ariaLabel: 'Cerca una citta',
    searching: 'Ricerca...',
    failed: 'Ricerca non riuscita',
    noMatches: 'Nessun risultato',
  },
  poster: {
    portraitTitle: 'Ritratto della biodiversita',
    sightingsOnGbif: 'Osservazioni su GBIF',
    iucnRedList: 'Lista Rossa IUCN',
    doingWell: 'In buono stato',
    watchList: 'Da monitorare',
    atRisk: 'A rischio',
    comparisonTitle: 'Confronto di questo luogo',
    cities: 'citta',
    countries: 'paesi',
    comparedWith: (count, cohort) => `rispetto a ${count} ${cohort}`,
    recordingIntensity: 'Intensita di registrazione',
    threatenedShare: 'Quota minacciata',
    percentile: (rank) => `Sopra ${rank}%`,
    percentileAria: (label, rank) => `${label} e sopra il ${rank}% dei luoghi simili`,
    mostObservedSpecies: 'Specie piu osservata',
    observations: (count) => `${count} osservazioni`,
    imageUnavailable: 'Immagine non disponibile',
    imageUnavailableAria: (alt) => `Immagine di ${alt} non disponibile`,
    speciesDetailsAria: (name) => `Dettagli di ${name}`,
    iucnTooltip: (label) => `IUCN: ${label}`,
    signatureTooltip: (ratio) => `Specie distintiva: ${ratio} piu rappresentata qui`,
    taxonLink: 'Vedi taxon su GBIF',
    photoBy: (author) => `Foto: ${author}`,
    photoSource: 'Fonte foto',
    photoSourceLabel: (label) => `Fonte foto: ${label}`,
    thematicInfo: {
      inSeason: 'Scelta per questo mese',
      smallWonders: 'Scelta tra piccoli taxon',
      nightCreatures: 'Scelta tra taxon notturni',
    },
    seasonality: 'Stagionalita',
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
      'Record di occorrenza, nomi dei taxon, conteggi, categorie IUCN, mix di evidenze, stagionalita e metadati dei principali dataset provengono da GBIF.',
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
    displayOptions: 'Opcoes de exibicao',
    language: 'Idioma',
    languageAria: 'Idioma dos nomes comuns',
    theme: 'Tema',
    about: 'Sobre / Metodo',
    regenerate: 'Regenerar',
    regenerateTitle: 'Regenerar layout e dados',
    share: 'Compartilhar',
    shareCopied: 'Link copiado',
    shareTitle: 'Copiar um link compartilhavel para este poster',
    pdf: 'PDF',
    pdfTitle: "Abrir a caixa de dialogo de impressao - escolher 'Salvar como PDF'",
    lockCard: 'Bloquear cartao',
    unlockCard: 'Desbloquear cartao',
    lockCardTitle: 'Bloquear conteudo e posicao do cartao',
    unlockCardTitle: 'Desbloquear cartao',
    loadingSnapshot: 'Carregando instantaneo completo do lugar...',
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
    sightingsOnGbif: 'Observacoes no GBIF',
    iucnRedList: 'Lista Vermelha da IUCN',
    doingWell: 'Em bom estado',
    watchList: 'Lista de atencao',
    atRisk: 'Em risco',
    comparisonTitle: 'Comparacao deste lugar',
    cities: 'cidades',
    countries: 'paises',
    comparedWith: (count, cohort) => `comparado com ${count} ${cohort}`,
    recordingIntensity: 'Intensidade de registro',
    threatenedShare: 'Proporcao ameacada',
    percentile: (rank) => `Acima ${rank}%`,
    percentileAria: (label, rank) => `${label} esta acima de ${rank}% de lugares semelhantes`,
    mostObservedSpecies: 'Especie mais observada',
    observations: (count) => `${count} observacoes`,
    imageUnavailable: 'Imagem indisponivel',
    imageUnavailableAria: (alt) => `Imagem de ${alt} indisponivel`,
    speciesDetailsAria: (name) => `Detalhes de ${name}`,
    iucnTooltip: (label) => `IUCN: ${label}`,
    signatureTooltip: (ratio) => `Especie assinatura: ${ratio} mais representada aqui`,
    taxonLink: 'Ver taxon no GBIF',
    photoBy: (author) => `Foto: ${author}`,
    photoSource: 'Fonte da foto',
    photoSourceLabel: (label) => `Fonte da foto: ${label}`,
    thematicInfo: {
      inSeason: 'Escolhida para este mes',
      smallWonders: 'Escolhida entre taxons pequenos',
      nightCreatures: 'Escolhida entre taxons noturnos',
    },
    seasonality: 'Sazonalidade',
    recordsSince: (year) => `Registros desde ${year}`,
    monthlyObservations: 'Observacoes mensais',
    peakYear: (year, count) => `Pico ${year}: ${count} obs`,
    inLastDecade: (percent) => `${percent}% na ultima decada`,
    evidenceMix: 'Mistura de evidencias',
    evidenceLabels: {
      HUMAN_OBSERVATION: 'Ciencia cidada',
      PRESERVED_SPECIMEN: 'Museu + herbario',
      MATERIAL_SAMPLE: 'Amostras de campo',
      MACHINE_OBSERVATION: 'Cameras + sensores',
      OBSERVATION: 'Observacao de campo',
    },
    otherSources: (count) => `${count} outra fonte${count === 1 ? '' : 's'}`,
    atRiskRibbon: (category) => `Em risco - ${category}`,
    signatureRibbon: (ratio) => `Assinatura - ${ratio}`,
    sources: 'Fontes',
    sourcesAttributionAria: 'Detalhes de atribuicao',
    sourcesDataNote:
      'Registros de ocorrencia, nomes de taxons, contagens, categorias IUCN, mistura de evidencias, sazonalidade e metadados dos principais conjuntos de dados vem do GBIF.',
    sourcesTopDatasets: 'Principais conjuntos de dados contribuintes',
    sourcesMatchingRecords: (count) => `${count} registros correspondentes`,
    sourcesPublisher: 'Publicador',
    sourcesLicense: 'Licenca',
    sourcesReuseNote:
      'Limites de busca e lugar usam OpenStreetMap Nominatim. O codigo QR reabre esta visualizacao Bee Around; para reutilizacao formal, revise as paginas vinculadas dos conjuntos de dados do GBIF.',
    openGbifDatasets: 'Abrir a pagina de conjuntos de dados do GBIF',
    printFooter:
      'Registros de ocorrencia, nomes de taxons, contagens, sinais de conservacao e metadados dos principais conjuntos de dados vêm do GBIF. Busca de lugar e limites usam OpenStreetMap Nominatim. Escaneie o codigo QR ou abra esta visualizacao Bee Around para links de conjuntos de dados, licencas, detalhes de DOI e atribuicao completa.',
    dataFrom: 'Dados de',
    scanQr: 'Escaneie para abrir este poster',
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
