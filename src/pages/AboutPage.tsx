import { normalizeUiLanguage, type UiLanguage } from '../i18n/uiText'

interface Props {
  onBack: () => void
  language: UiLanguage
}

type AboutText = {
  back: string
  kicker: string
  description: string
  docLinksAria: string
  howItWorks: string
  dataNotes: string
  posterIngredientsAria: string
  posterIngredients: string[]
  teamAria: string
  developerCardAria: string
  designerCardAria: string
  developer: string
  designer: string
  area: {
    title: string
    p1: string
    p2: string
    flowAria: string
    flow: string[]
    mapAria: string
    mapLabel: string
  }
  data: {
    title: string
    p1: string
    p2: string
    queryAria: string
    countFacets: string
    arrow: string
    signals: string[]
  }
  species: {
    title: string
    p1: string
    p2: string
    groups: string[]
    arrow: string
    boardAria: string
    boardLabels: string[]
  }
  labels: {
    title: string
    season: string
    seasonDescription: string
    small: string
    smallDescription: string
    night: string
    nightDescription: string
    risk: string
    riskDescription: string
    signature: string
    signatureDescription: string
  }
  photos: {
    title: string
    p1: string
    p2: string
    fallbackAria: string
    steps: string[]
    firstMatchWins: string
  }
  comparison: {
    title: string
    p1: string
    p2: string
    flowAria: string
    flow: string[]
    barsAria: string
    recordingIntensity: string
    threatenedShare: string
  }
  regenerate: {
    title: string
    p1: string
    p2: string
    seed1: string
    seed2: string
    shareUrl: string
  }
  credits: {
    title: string
    p: string
    dataAndAttribution: string
  }
}

const ABOUT_TEXT: Record<UiLanguage, AboutText> = {
  en: {
    back: 'Back',
    kicker: 'About',
    description:
      'Bee Around turns open GBIF biodiversity records into playful, shareable portraits of places. Pick a place, refresh for a new lens, lock favorite cards, and export a poster for outreach, education, or quick discovery.',
    docLinksAria: 'Detailed documentation links',
    howItWorks: 'How it works',
    dataNotes: 'Data notes',
    posterIngredientsAria: 'Poster ingredients',
    posterIngredients: ['Sightings on GBIF', 'Biodiversity Portrait', 'Data from GBIF'],
    teamAria: 'Project team',
    developerCardAria: 'Developer card',
    designerCardAria: 'Designer card',
    developer: 'Developer',
    designer: 'Designer',
    area: {
      title: 'What area is the poster about?',
      p1: 'Place search comes from OpenStreetMap Nominatim. Bee Around keeps the selected label, center point, country code, and bounding box.',
      p2: 'GBIF queries prefer that bounding box. If none exists, the app makes a rectangle from the fallback radius. Very large boxes use country=XX when possible.',
      flowAria: 'Area selection flow',
      flow: ['Place search', 'Bounding box', 'GBIF records'],
      mapAria: 'Bounding box area sketch',
      mapLabel: 'selected area',
    },
    data: {
      title: 'Which GBIF data is summarized?',
      p1: 'The poster asks GBIF for compact occurrence facets with limit=0. That gives counts and grouped summaries without downloading every record.',
      p2: 'The main query groups by month, year, dataset, kingdom, and evidence type. Smaller queries build species, conservation, and thematic candidate pools.',
      queryAria: 'GBIF summary query sketch',
      countFacets: 'count + facets',
      arrow: 'facets become cards',
      signals: ['Month', 'Year', 'Kingdom', 'Dataset', 'Evidence type'],
    },
    species: {
      title: 'How are species selected?',
      p1: 'Featured species come from broad taxonomic slots. Each slot asks GBIF for the most recorded local species in that class or kingdom.',
      p2: 'Bee Around keeps a small top pool, removes weakly represented candidates, then uses the poster seed to choose a repeatable mix.',
      groups: ['Mammal', 'Bird', 'Insect', 'Flowering plant', 'Tree or fern', 'Fungus'],
      arrow: 'top local candidates',
      boardAria: 'Species slot selection sketch',
      boardLabels: ['Bird', 'Insect', 'Plant'],
    },
    labels: {
      title: 'What do the poster labels mean?',
      season: 'In season - June',
      seasonDescription: 'Seeded from top species recorded in the current calendar month.',
      small: 'Small wonder',
      smallDescription: 'Seeded from top local insect and fungus candidates.',
      night: 'Night creature',
      nightDescription: 'Seeded from top local bats, owls, moths, fireflies, and related groups.',
      risk: 'At risk - CR',
      riskDescription: 'Chosen from top local species in the highest available IUCN risk bucket.',
      signature: 'Signature - 12x',
      signatureDescription: 'Chosen from species whose local GBIF share is high versus the global baseline.',
    },
    photos: {
      title: 'How are photos chosen?',
      p1: 'Species identity is chosen from GBIF data first. Images are a best-effort fallback layer added afterward.',
      p2: 'Sources are tried in priority order. If no image resolves, the species stays and the card uses a placeholder.',
      fallbackAria: 'Photo fallback priority',
      steps: ['iNaturalist exact match', 'Wikidata / Commons GBIF key', 'GBIF species media'],
      firstMatchWins: 'first match wins',
    },
    comparison: {
      title: 'How does the comparison work?',
      p1: 'A notebook resolves curated cities and countries, then queries GBIF facets for each bounding box.',
      p2: 'It computes area, record density, threatened share, and unique-species counts, then ranks rows inside city or country cohorts. The app ships the slim percentile file.',
      flowAria: 'Precompute workflow',
      flow: ['places', 'facets', 'percentiles'],
      barsAria: 'Example comparison bars',
      recordingIntensity: 'Recording intensity',
      threatenedShare: 'Threatened share',
    },
    regenerate: {
      title: 'Why does Regenerate stay repeatable?',
      p1: 'Every poster has a seed. Regenerate changes the seed, rotating eligible top candidates and unlocked card positions.',
      p2: 'Species are deduplicated across cards, and shared links store the place, seed, theme, language, and locks.',
      seed1: 'Seed 1',
      seed2: 'Seed 2',
      shareUrl: 'Share URL',
    },
    credits: {
      title: 'Where do credits come from?',
      p: 'Species names, taxonomy, occurrence counts, dataset metadata, and GBIF species links come from GBIF. Photo credits and licenses are shown when the image source provides them.',
      dataAndAttribution: 'Data and attribution',
    },
  },
  fr: {
    back: 'Retour',
    kicker: 'A propos',
    description:
      'Bee Around transforme les donnees ouvertes de biodiversite de GBIF en portraits de lieux ludiques et partageables. Choisissez un lieu, actualisez pour obtenir un nouvel angle, verrouillez vos cartes preferees et exportez une affiche pour la mediation, l\'education ou la decouverte rapide.',
    docLinksAria: 'Liens de documentation detailles',
    howItWorks: 'Fonctionnement',
    dataNotes: 'Notes sur les donnees',
    posterIngredientsAria: 'Ingredients de l\'affiche',
    posterIngredients: ['Observations sur GBIF', 'Portrait de biodiversite', 'Donnees de GBIF'],
    teamAria: 'Equipe du projet',
    developerCardAria: 'Carte developpeur',
    designerCardAria: 'Carte designer',
    developer: 'Developpeur',
    designer: 'Designer',
    area: {
      title: 'Quelle zone l\'affiche couvre-t-elle ?',
      p1: 'La recherche de lieu vient d\'OpenStreetMap Nominatim. Bee Around conserve le libelle choisi, le point central, le code pays et la boite englobante.',
      p2: 'Les requetes GBIF privilegient cette boite englobante. Si elle n\'existe pas, l\'app cree un rectangle avec le rayon de secours. Les tres grandes boites utilisent country=XX quand c\'est possible.',
      flowAria: 'Flux de selection de zone',
      flow: ['Recherche de lieu', 'Boite englobante', 'Donnees GBIF'],
      mapAria: 'Schema de zone par boite englobante',
      mapLabel: 'zone choisie',
    },
    data: {
      title: 'Quelles donnees GBIF sont resumees ?',
      p1: 'L\'affiche demande a GBIF des facettes compactes d\'occurrences avec limit=0. Cela donne des totaux et des resumes groupes sans telecharger chaque occurrence.',
      p2: 'La requete principale groupe par mois, annee, jeu de donnees, regne et type de preuve. De plus petites requetes construisent les listes candidates pour les especes, la conservation et les themes.',
      queryAria: 'Schema de requete de resume GBIF',
      countFacets: 'total + facettes',
      arrow: 'les facettes deviennent des cartes',
      signals: ['Mois', 'Annee', 'Regne', 'Jeu de donnees', 'Type de preuve'],
    },
    species: {
      title: 'Comment les especes sont-elles choisies ?',
      p1: 'Les especes mises en avant viennent de grands emplacements taxonomiques. Chaque emplacement demande a GBIF les especes locales les plus enregistrees dans cette classe ou ce regne.',
      p2: 'Bee Around garde un petit groupe de tete, retire les candidats faiblement representes, puis utilise la graine de l\'affiche pour choisir un melange reproductible.',
      groups: ['Mammifere', 'Oiseau', 'Insecte', 'Plante a fleurs', 'Arbre ou fougere', 'Champignon'],
      arrow: 'meilleurs candidats locaux',
      boardAria: 'Schema de selection des emplacements d\'especes',
      boardLabels: ['Oiseau', 'Insecte', 'Plante'],
    },
    labels: {
      title: 'Que signifient les etiquettes de l\'affiche ?',
      season: 'De saison - juin',
      seasonDescription: 'Tire des especes les plus enregistrees pendant le mois calendaire courant.',
      small: 'Petite merveille',
      smallDescription: 'Tire des principaux candidats locaux chez les insectes et les champignons.',
      night: 'Creature nocturne',
      nightDescription: 'Tire des principaux candidats locaux parmi chauves-souris, hiboux, papillons de nuit, lucioles et groupes proches.',
      risk: 'Menace - CR',
      riskDescription: 'Choisi parmi les principales especes locales du niveau de risque IUCN le plus eleve disponible.',
      signature: 'Signature - 12x',
      signatureDescription: 'Choisi parmi les especes dont la part GBIF locale est elevee par rapport a la base mondiale.',
    },
    photos: {
      title: 'Comment les photos sont-elles choisies ?',
      p1: 'L\'identite de l\'espece est d\'abord choisie depuis les donnees GBIF. Les images sont une couche de secours ajoutee ensuite au mieux.',
      p2: 'Les sources sont essayees par ordre de priorite. Si aucune image n\'est trouvee, l\'espece reste et la carte utilise un emplacement reserve.',
      fallbackAria: 'Priorite de secours des photos',
      steps: ['Correspondance exacte iNaturalist', 'Cle GBIF Wikidata / Commons', 'Medias d\'espece GBIF'],
      firstMatchWins: 'la premiere correspondance gagne',
    },
    comparison: {
      title: 'Comment fonctionne la comparaison ?',
      p1: 'Un notebook resout des villes et pays selectionnes, puis interroge les facettes GBIF pour chaque boite englobante.',
      p2: 'Il calcule la surface, la densite de donnees, la part menacee et le nombre d\'especes uniques, puis classe les lignes dans les cohortes ville ou pays. L\'app embarque le fichier leger de percentiles.',
      flowAria: 'Flux de pre-calcul',
      flow: ['lieux', 'facettes', 'percentiles'],
      barsAria: 'Exemples de barres de comparaison',
      recordingIntensity: 'Intensite de collecte',
      threatenedShare: 'Part menacee',
    },
    regenerate: {
      title: 'Pourquoi Regenerer reste-t-il reproductible ?',
      p1: 'Chaque affiche a une graine. Regenerer change la graine, ce qui fait tourner les candidats eligibles et les positions de cartes non verrouillees.',
      p2: 'Les especes sont dedoublonnees entre les cartes, et les liens partages stockent le lieu, la graine, le theme, la langue et les verrouillages.',
      seed1: 'Graine 1',
      seed2: 'Graine 2',
      shareUrl: 'URL de partage',
    },
    credits: {
      title: 'D\'ou viennent les credits ?',
      p: 'Les noms d\'especes, la taxonomie, les totaux d\'occurrences, les metadonnees de jeux de donnees et les liens d\'especes GBIF viennent de GBIF. Les credits photo et licences sont affiches quand la source d\'image les fournit.',
      dataAndAttribution: 'Donnees et attribution',
    },
  },
  es: {
    back: 'Volver',
    kicker: 'Acerca de',
    description:
      'Bee Around convierte registros abiertos de biodiversidad de GBIF en retratos de lugares juguetones y compartibles. Elige un lugar, actualiza para obtener una nueva mirada, bloquea tus tarjetas favoritas y exporta un poster para divulgacion, educacion o descubrimiento rapido.',
    docLinksAria: 'Enlaces de documentacion detallada',
    howItWorks: 'Como funciona',
    dataNotes: 'Notas de datos',
    posterIngredientsAria: 'Ingredientes del poster',
    posterIngredients: ['Observaciones en GBIF', 'Retrato de biodiversidad', 'Datos de GBIF'],
    teamAria: 'Equipo del proyecto',
    developerCardAria: 'Tarjeta de desarrollador',
    designerCardAria: 'Tarjeta de disenador',
    developer: 'Desarrollador',
    designer: 'Disenador',
    area: {
      title: 'De que area trata el poster?',
      p1: 'La busqueda de lugares viene de OpenStreetMap Nominatim. Bee Around conserva la etiqueta seleccionada, el punto central, el codigo de pais y el cuadro delimitador.',
      p2: 'Las consultas a GBIF prefieren ese cuadro delimitador. Si no existe, la app crea un rectangulo con el radio de respaldo. Los cuadros muy grandes usan country=XX cuando es posible.',
      flowAria: 'Flujo de seleccion de area',
      flow: ['Busqueda de lugar', 'Cuadro delimitador', 'Registros GBIF'],
      mapAria: 'Boceto del area del cuadro delimitador',
      mapLabel: 'area seleccionada',
    },
    data: {
      title: 'Que datos de GBIF se resumen?',
      p1: 'El poster pide a GBIF facetas compactas de ocurrencias con limit=0. Eso da conteos y resumenes agrupados sin descargar todos los registros.',
      p2: 'La consulta principal agrupa por mes, ano, conjunto de datos, reino y tipo de evidencia. Consultas mas pequenas crean grupos candidatos de especies, conservacion y temas.',
      queryAria: 'Boceto de consulta resumida de GBIF',
      countFacets: 'conteo + facetas',
      arrow: 'las facetas se vuelven tarjetas',
      signals: ['Mes', 'Ano', 'Reino', 'Dataset', 'Tipo de evidencia'],
    },
    species: {
      title: 'Como se seleccionan las especies?',
      p1: 'Las especies destacadas vienen de ranuras taxonomicas amplias. Cada ranura pide a GBIF las especies locales mas registradas en esa clase o reino.',
      p2: 'Bee Around mantiene un pequeno grupo principal, elimina candidatos con poca representacion y luego usa la semilla del poster para elegir una mezcla repetible.',
      groups: ['Mamifero', 'Ave', 'Insecto', 'Planta con flor', 'Arbol o helecho', 'Hongo'],
      arrow: 'principales candidatos locales',
      boardAria: 'Boceto de seleccion de ranuras de especies',
      boardLabels: ['Ave', 'Insecto', 'Planta'],
    },
    labels: {
      title: 'Que significan las etiquetas del poster?',
      season: 'En temporada - junio',
      seasonDescription: 'Sembrada desde especies principales registradas en el mes calendario actual.',
      small: 'Pequena maravilla',
      smallDescription: 'Sembrada desde los principales candidatos locales de insectos y hongos.',
      night: 'Criatura nocturna',
      nightDescription: 'Sembrada desde murcielagos, buhos, polillas, luciernagas y grupos relacionados locales principales.',
      risk: 'En riesgo - CR',
      riskDescription: 'Elegida entre especies locales principales en la categoria de riesgo IUCN mas alta disponible.',
      signature: 'Firma - 12x',
      signatureDescription: 'Elegida entre especies cuya proporcion local en GBIF es alta frente a la linea base global.',
    },
    photos: {
      title: 'Como se eligen las fotos?',
      p1: 'La identidad de la especie se elige primero desde datos de GBIF. Las imagenes son una capa de respaldo de mejor esfuerzo que se agrega despues.',
      p2: 'Las fuentes se prueban por orden de prioridad. Si no aparece ninguna imagen, la especie permanece y la tarjeta usa un marcador de posicion.',
      fallbackAria: 'Prioridad de respaldo de fotos',
      steps: ['Coincidencia exacta de iNaturalist', 'Clave GBIF de Wikidata / Commons', 'Medios de especie en GBIF'],
      firstMatchWins: 'gana la primera coincidencia',
    },
    comparison: {
      title: 'Como funciona la comparacion?',
      p1: 'Un notebook resuelve ciudades y paises curados, y luego consulta facetas de GBIF para cada cuadro delimitador.',
      p2: 'Calcula area, densidad de registros, proporcion amenazada y conteos de especies unicas, y despues ordena filas dentro de cohortes de ciudad o pais. La app incluye el archivo ligero de percentiles.',
      flowAria: 'Flujo de precalculo',
      flow: ['lugares', 'facetas', 'percentiles'],
      barsAria: 'Barras de comparacion de ejemplo',
      recordingIntensity: 'Intensidad de registro',
      threatenedShare: 'Proporcion amenazada',
    },
    regenerate: {
      title: 'Por que Regenerar sigue siendo repetible?',
      p1: 'Cada poster tiene una semilla. Regenerar cambia la semilla, rotando candidatos principales elegibles y posiciones de tarjetas desbloqueadas.',
      p2: 'Las especies se deduplican entre tarjetas, y los enlaces compartidos guardan el lugar, la semilla, el tema, el idioma y los bloqueos.',
      seed1: 'Semilla 1',
      seed2: 'Semilla 2',
      shareUrl: 'URL compartida',
    },
    credits: {
      title: 'De donde vienen los creditos?',
      p: 'Los nombres de especies, taxonomia, conteos de ocurrencias, metadatos de datasets y enlaces de especies de GBIF vienen de GBIF. Los creditos y licencias de fotos se muestran cuando la fuente de imagen los proporciona.',
      dataAndAttribution: 'Datos y atribucion',
    },
  },
  tr: {
    back: 'Geri',
    kicker: 'Hakkında',
    description:
      'Bee Around, GBIF\'teki açık biyoçeşitlilik kayıtlarını yerlerin eğlenceli ve paylaşılabilir portrelerine dönüştürür. Bir yer seçin, yeni bir bakış için yenileyin, sevdiğiniz kartları kilitleyin ve erişim, eğitim ya da hızlı keşif için poster dışa aktarın.',
    docLinksAria: 'Ayrıntılı dokümantasyon bağlantıları',
    howItWorks: 'Nasıl çalışır',
    dataNotes: 'Veri notları',
    posterIngredientsAria: 'Poster bileşenleri',
    posterIngredients: ['GBIF gözlemleri', 'Biyoçeşitlilik Portresi', 'GBIF verisi'],
    teamAria: 'Proje ekibi',
    developerCardAria: 'Geliştirici kartı',
    designerCardAria: 'Tasarımcı kartı',
    developer: 'Geliştirici',
    designer: 'Tasarımcı',
    area: {
      title: 'Poster hangi alanı anlatıyor?',
      p1: 'Yer araması OpenStreetMap Nominatim üzerinden gelir. Bee Around seçilen etiketi, merkez noktasını, ülke kodunu ve sınırlayıcı kutuyu saklar.',
      p2: 'GBIF sorguları öncelikle bu sınırlayıcı kutuyu kullanır. Kutu yoksa uygulama yedek yarıçaptan bir dikdörtgen oluşturur. Çok büyük kutularda mümkünse country=XX kullanılır.',
      flowAria: 'Alan seçimi akışı',
      flow: ['Yer araması', 'Sınırlayıcı kutu', 'GBIF kayıtları'],
      mapAria: 'Sınırlayıcı kutu alan çizimi',
      mapLabel: 'seçilen alan',
    },
    data: {
      title: 'Hangi GBIF verileri özetleniyor?',
      p1: 'Poster, GBIF\'ten limit=0 ile kompakt oluşum facetleri ister. Böylece her kaydı indirmeden sayılar ve gruplanmış özetler alınır.',
      p2: 'Ana sorgu ay, yıl, veri seti, alem ve kanıt türüne göre gruplar. Daha küçük sorgular tür, koruma ve tematik aday havuzlarını oluşturur.',
      queryAria: 'GBIF özet sorgusu çizimi',
      countFacets: 'sayı + facetler',
      arrow: 'facetler kartlara dönüşür',
      signals: ['Ay', 'Yıl', 'Alem', 'Veri seti', 'Kanıt türü'],
    },
    species: {
      title: 'Türler nasıl seçiliyor?',
      p1: 'Öne çıkan türler geniş taksonomik yuvalardan gelir. Her yuva, o sınıf veya alemde en çok kaydedilen yerel türleri GBIF\'ten ister.',
      p2: 'Bee Around küçük bir üst havuz tutar, zayıf temsil edilen adayları çıkarır, sonra tekrarlanabilir bir karışım seçmek için poster tohumunu kullanır.',
      groups: ['Memeli', 'Kuş', 'Böcek', 'Çiçekli bitki', 'Ağaç veya eğrelti', 'Mantar'],
      arrow: 'en iyi yerel adaylar',
      boardAria: 'Tür yuvası seçim çizimi',
      boardLabels: ['Kuş', 'Böcek', 'Bitki'],
    },
    labels: {
      title: 'Poster etiketleri ne anlama geliyor?',
      season: 'Sezonda - Haziran',
      seasonDescription: 'Geçerli takvim ayında kaydedilen en iyi türlerden tohumlanır.',
      small: 'Küçük mucize',
      smallDescription: 'En iyi yerel böcek ve mantar adaylarından tohumlanır.',
      night: 'Gece canlısı',
      nightDescription: 'Yarasa, baykuş, güve, ateş böceği ve ilgili gruplardaki en iyi yerel adaylardan tohumlanır.',
      risk: 'Risk altında - CR',
      riskDescription: 'Mevcut en yüksek IUCN risk kategorisindeki en iyi yerel türlerden seçilir.',
      signature: 'İmza - 12x',
      signatureDescription: 'Yerel GBIF payı küresel temele göre yüksek olan türlerden seçilir.',
    },
    photos: {
      title: 'Fotoğraflar nasıl seçiliyor?',
      p1: 'Tür kimliği önce GBIF verisinden seçilir. Görseller sonradan eklenen en iyi çaba yedek katmanıdır.',
      p2: 'Kaynaklar öncelik sırasıyla denenir. Görsel bulunamazsa tür kalır ve kart yer tutucu kullanır.',
      fallbackAria: 'Fotoğraf yedek önceliği',
      steps: ['iNaturalist tam eşleşme', 'Wikidata / Commons GBIF anahtarı', 'GBIF tür medyası'],
      firstMatchWins: 'ilk eşleşme kazanır',
    },
    comparison: {
      title: 'Karşılaştırma nasıl çalışıyor?',
      p1: 'Bir notebook seçilmiş şehirleri ve ülkeleri çözer, sonra her sınırlayıcı kutu için GBIF facetlerini sorgular.',
      p2: 'Alanı, kayıt yoğunluğunu, tehdit altındaki payı ve benzersiz tür sayılarını hesaplar; sonra satırları şehir veya ülke grupları içinde sıralar. Uygulama ince percentile dosyasını içerir.',
      flowAria: 'Ön hesaplama iş akışı',
      flow: ['yerler', 'facetler', 'percentilelar'],
      barsAria: 'Örnek karşılaştırma çubukları',
      recordingIntensity: 'Kayıt yoğunluğu',
      threatenedShare: 'Tehdit altındaki pay',
    },
    regenerate: {
      title: 'Yenile neden tekrarlanabilir kalıyor?',
      p1: 'Her posterin bir tohumu vardır. Yenile tohumu değiştirir; uygun üst adayları ve kilitsiz kart konumlarını döndürür.',
      p2: 'Türler kartlar arasında tekilleştirilir; paylaşılan bağlantılar yeri, tohumu, temayı, dili ve kilitleri saklar.',
      seed1: 'Tohum 1',
      seed2: 'Tohum 2',
      shareUrl: 'Paylaşım URL\'si',
    },
    credits: {
      title: 'Krediler nereden geliyor?',
      p: 'Tür adları, taksonomi, oluşum sayıları, veri seti metadataları ve GBIF tür bağlantıları GBIF\'ten gelir. Fotoğraf kredileri ve lisansları, görsel kaynağı sağladığında gösterilir.',
      dataAndAttribution: 'Veri ve atıf',
    },
  },
  de: {
    back: 'Zuruck',
    kicker: 'Uber',
    description:
      'Bee Around verwandelt offene GBIF-Biodiversitatsdaten in spielerische, teilbare Portrats von Orten. Wahlen Sie einen Ort, aktualisieren Sie fur eine neue Perspektive, sperren Sie Lieblingskarten und exportieren Sie ein Poster fur Vermittlung, Bildung oder schnelle Entdeckung.',
    docLinksAria: 'Detaillierte Dokumentationslinks',
    howItWorks: 'So funktioniert es',
    dataNotes: 'Datennotizen',
    posterIngredientsAria: 'Poster-Bestandteile',
    posterIngredients: ['GBIF-Nachweise', 'Biodiversitatsportrat', 'Daten von GBIF'],
    teamAria: 'Projektteam',
    developerCardAria: 'Entwicklerkarte',
    designerCardAria: 'Designerkarte',
    developer: 'Entwickler',
    designer: 'Designer',
    area: {
      title: 'Welches Gebiet zeigt das Poster?',
      p1: 'Die Ortssuche kommt von OpenStreetMap Nominatim. Bee Around speichert das gewahlte Label, den Mittelpunkt, den Landercode und die Bounding Box.',
      p2: 'GBIF-Abfragen nutzen bevorzugt diese Bounding Box. Wenn keine existiert, erstellt die App ein Rechteck aus dem Ersatzradius. Sehr grosse Boxen verwenden nach Moglichkeit country=XX.',
      flowAria: 'Ablauf der Gebietsauswahl',
      flow: ['Ortssuche', 'Bounding Box', 'GBIF-Daten'],
      mapAria: 'Skizze des Bounding-Box-Gebiets',
      mapLabel: 'gewahltes Gebiet',
    },
    data: {
      title: 'Welche GBIF-Daten werden zusammengefasst?',
      p1: 'Das Poster fragt GBIF nach kompakten Vorkommens-Facetten mit limit=0. Dadurch entstehen Zahlen und gruppierte Zusammenfassungen, ohne jeden Datensatz herunterzuladen.',
      p2: 'Die Hauptabfrage gruppiert nach Monat, Jahr, Datensatz, Reich und Evidenztyp. Kleinere Abfragen bilden Kandidatenpools fur Arten, Schutzstatus und Themen.',
      queryAria: 'Skizze der GBIF-Zusammenfassungsabfrage',
      countFacets: 'Zahl + Facetten',
      arrow: 'Facetten werden Karten',
      signals: ['Monat', 'Jahr', 'Reich', 'Datensatz', 'Evidenztyp'],
    },
    species: {
      title: 'Wie werden Arten ausgewahlt?',
      p1: 'Vorgestellte Arten stammen aus breiten taxonomischen Slots. Jeder Slot fragt GBIF nach den lokal am haufigsten erfassten Arten dieser Klasse oder dieses Reichs.',
      p2: 'Bee Around behalt einen kleinen Top-Pool, entfernt schwach vertretene Kandidaten und nutzt dann den Poster-Seed fur eine reproduzierbare Mischung.',
      groups: ['Saugetier', 'Vogel', 'Insekt', 'Blutenpflanze', 'Baum oder Farn', 'Pilz'],
      arrow: 'beste lokale Kandidaten',
      boardAria: 'Skizze der Arten-Slot-Auswahl',
      boardLabels: ['Vogel', 'Insekt', 'Pflanze'],
    },
    labels: {
      title: 'Was bedeuten die Poster-Labels?',
      season: 'Saison - Juni',
      seasonDescription: 'Aus Top-Arten gebildet, die im aktuellen Kalendermonat erfasst wurden.',
      small: 'Kleines Wunder',
      smallDescription: 'Aus den besten lokalen Insekten- und Pilzkandidaten gebildet.',
      night: 'Nachtaktive Art',
      nightDescription: 'Aus lokalen Top-Kandidaten wie Fledermausen, Eulen, Nachtfaltern, Leuchtkafern und verwandten Gruppen gebildet.',
      risk: 'Gefahrdet - CR',
      riskDescription: 'Aus lokalen Top-Arten in der hochsten verfugbaren IUCN-Risikokategorie gewahlt.',
      signature: 'Signatur - 12x',
      signatureDescription: 'Aus Arten gewahlt, deren lokaler GBIF-Anteil gegenuber der globalen Basis hoch ist.',
    },
    photos: {
      title: 'Wie werden Fotos ausgewahlt?',
      p1: 'Die Artidentitat wird zuerst aus GBIF-Daten gewahlt. Bilder sind eine nachtragliche Best-Effort-Ersatzschicht.',
      p2: 'Quellen werden in Prioritatsreihenfolge versucht. Wenn kein Bild gefunden wird, bleibt die Art erhalten und die Karte nutzt einen Platzhalter.',
      fallbackAria: 'Prioritat der Foto-Ersatzquellen',
      steps: ['iNaturalist-Exakttreffer', 'Wikidata / Commons GBIF-Key', 'GBIF-Artenmedien'],
      firstMatchWins: 'erster Treffer gewinnt',
    },
    comparison: {
      title: 'Wie funktioniert der Vergleich?',
      p1: 'Ein Notebook lost kuratierte Stadte und Lander auf und fragt dann GBIF-Facetten fur jede Bounding Box ab.',
      p2: 'Es berechnet Flache, Nachweisdichte, Anteil gefahrdeter Arten und Zahlen eindeutiger Arten und rankt die Zeilen innerhalb von Stadt- oder Landerkohorten. Die App liefert die schlanke Percentile-Datei mit.',
      flowAria: 'Precompute-Workflow',
      flow: ['Orte', 'Facetten', 'Percentiles'],
      barsAria: 'Beispiel-Vergleichsbalken',
      recordingIntensity: 'Erfassungsintensitat',
      threatenedShare: 'Anteil gefahrdeter Arten',
    },
    regenerate: {
      title: 'Warum bleibt Neu generieren reproduzierbar?',
      p1: 'Jedes Poster hat einen Seed. Neu generieren andert den Seed und rotiert geeignete Top-Kandidaten sowie nicht gesperrte Kartenpositionen.',
      p2: 'Arten werden uber Karten hinweg dedupliziert, und geteilte Links speichern Ort, Seed, Theme, Sprache und Sperren.',
      seed1: 'Seed 1',
      seed2: 'Seed 2',
      shareUrl: 'Teilen-URL',
    },
    credits: {
      title: 'Woher kommen die Credits?',
      p: 'Artnamen, Taxonomie, Vorkommenszahlen, Datensatzmetadaten und GBIF-Artenlinks kommen von GBIF. Fotocredits und Lizenzen werden angezeigt, wenn die Bildquelle sie bereitstellt.',
      dataAndAttribution: 'Daten und Attribution',
    },
  },
  it: {
    back: 'Indietro',
    kicker: 'Informazioni',
    description:
      'Bee Around trasforma i record aperti di biodiversita di GBIF in ritratti di luoghi giocosi e condivisibili. Scegli un luogo, aggiorna per una nuova prospettiva, blocca le schede preferite ed esporta un poster per divulgazione, educazione o scoperta rapida.',
    docLinksAria: 'Link alla documentazione dettagliata',
    howItWorks: 'Come funziona',
    dataNotes: 'Note sui dati',
    posterIngredientsAria: 'Ingredienti del poster',
    posterIngredients: ['Osservazioni su GBIF', 'Ritratto della biodiversita', 'Dati da GBIF'],
    teamAria: 'Team del progetto',
    developerCardAria: 'Scheda sviluppatore',
    designerCardAria: 'Scheda designer',
    developer: 'Sviluppatore',
    designer: 'Designer',
    area: {
      title: 'Di quale area parla il poster?',
      p1: 'La ricerca dei luoghi arriva da OpenStreetMap Nominatim. Bee Around conserva etichetta scelta, punto centrale, codice paese e bounding box.',
      p2: 'Le query GBIF preferiscono quella bounding box. Se non esiste, l\'app crea un rettangolo dal raggio di fallback. Le box molto grandi usano country=XX quando possibile.',
      flowAria: 'Flusso di selezione area',
      flow: ['Ricerca luogo', 'Bounding box', 'Record GBIF'],
      mapAria: 'Schizzo dell\'area della bounding box',
      mapLabel: 'area selezionata',
    },
    data: {
      title: 'Quali dati GBIF vengono riassunti?',
      p1: 'Il poster chiede a GBIF faccette compatte di occorrenze con limit=0. Questo fornisce conteggi e riepiloghi raggruppati senza scaricare ogni record.',
      p2: 'La query principale raggruppa per mese, anno, dataset, regno e tipo di evidenza. Query piu piccole costruiscono pool candidati per specie, conservazione e temi.',
      queryAria: 'Schizzo della query riassuntiva GBIF',
      countFacets: 'conteggio + faccette',
      arrow: 'le faccette diventano schede',
      signals: ['Mese', 'Anno', 'Regno', 'Dataset', 'Tipo di evidenza'],
    },
    species: {
      title: 'Come vengono selezionate le specie?',
      p1: 'Le specie in evidenza arrivano da ampi slot tassonomici. Ogni slot chiede a GBIF le specie locali piu registrate in quella classe o regno.',
      p2: 'Bee Around mantiene un piccolo pool di testa, rimuove i candidati poco rappresentati e poi usa il seed del poster per scegliere un mix ripetibile.',
      groups: ['Mammifero', 'Uccello', 'Insetto', 'Pianta da fiore', 'Albero o felce', 'Fungo'],
      arrow: 'migliori candidati locali',
      boardAria: 'Schizzo di selezione degli slot specie',
      boardLabels: ['Uccello', 'Insetto', 'Pianta'],
    },
    labels: {
      title: 'Cosa significano le etichette del poster?',
      season: 'Di stagione - giugno',
      seasonDescription: 'Generata dalle specie principali registrate nel mese di calendario corrente.',
      small: 'Piccola meraviglia',
      smallDescription: 'Generata dai principali candidati locali tra insetti e funghi.',
      night: 'Creatura notturna',
      nightDescription: 'Generata dai principali candidati locali tra pipistrelli, gufi, falene, lucciole e gruppi collegati.',
      risk: 'A rischio - CR',
      riskDescription: 'Scelta tra le principali specie locali nella categoria di rischio IUCN piu alta disponibile.',
      signature: 'Firma - 12x',
      signatureDescription: 'Scelta tra specie la cui quota GBIF locale e alta rispetto alla base globale.',
    },
    photos: {
      title: 'Come vengono scelte le foto?',
      p1: 'L\'identita della specie viene scelta prima dai dati GBIF. Le immagini sono un livello di fallback best-effort aggiunto dopo.',
      p2: 'Le fonti vengono provate in ordine di priorita. Se nessuna immagine si risolve, la specie resta e la scheda usa un segnaposto.',
      fallbackAria: 'Priorita di fallback foto',
      steps: ['Corrispondenza esatta iNaturalist', 'Chiave GBIF Wikidata / Commons', 'Media specie GBIF'],
      firstMatchWins: 'vince la prima corrispondenza',
    },
    comparison: {
      title: 'Come funziona il confronto?',
      p1: 'Un notebook risolve citta e paesi curati, poi interroga le faccette GBIF per ogni bounding box.',
      p2: 'Calcola area, densita di record, quota minacciata e conteggi di specie uniche, poi classifica le righe dentro coorti di citta o paese. L\'app include il file percentile leggero.',
      flowAria: 'Flusso di precomputazione',
      flow: ['luoghi', 'faccette', 'percentili'],
      barsAria: 'Barre di confronto di esempio',
      recordingIntensity: 'Intensita di registrazione',
      threatenedShare: 'Quota minacciata',
    },
    regenerate: {
      title: 'Perche Rigenera resta ripetibile?',
      p1: 'Ogni poster ha un seed. Rigenera cambia il seed, ruotando candidati principali idonei e posizioni delle schede non bloccate.',
      p2: 'Le specie sono deduplicate tra schede, e i link condivisi salvano luogo, seed, tema, lingua e blocchi.',
      seed1: 'Seed 1',
      seed2: 'Seed 2',
      shareUrl: 'URL di condivisione',
    },
    credits: {
      title: 'Da dove arrivano i crediti?',
      p: 'Nomi delle specie, tassonomia, conteggi di occorrenza, metadati dei dataset e link specie GBIF arrivano da GBIF. Crediti e licenze foto sono mostrati quando la fonte immagine li fornisce.',
      dataAndAttribution: 'Dati e attribuzione',
    },
  },
  pt: {
    back: 'Voltar',
    kicker: 'Sobre',
    description:
      'Bee Around transforma registros abertos de biodiversidade do GBIF em retratos de lugares divertidos e compartilhaveis. Escolha um lugar, atualize para uma nova lente, bloqueie cartoes favoritos e exporte um poster para divulgacao, educacao ou descoberta rapida.',
    docLinksAria: 'Links de documentacao detalhada',
    howItWorks: 'Como funciona',
    dataNotes: 'Notas de dados',
    posterIngredientsAria: 'Ingredientes do poster',
    posterIngredients: ['Observacoes no GBIF', 'Retrato da biodiversidade', 'Dados do GBIF'],
    teamAria: 'Equipe do projeto',
    developerCardAria: 'Cartao de desenvolvedor',
    designerCardAria: 'Cartao de designer',
    developer: 'Desenvolvedor',
    designer: 'Designer',
    area: {
      title: 'De que area o poster trata?',
      p1: 'A busca de lugar vem do OpenStreetMap Nominatim. Bee Around guarda o rotulo selecionado, ponto central, codigo do pais e caixa delimitadora.',
      p2: 'As consultas ao GBIF preferem essa caixa delimitadora. Se ela nao existir, o app cria um retangulo a partir do raio de fallback. Caixas muito grandes usam country=XX quando possivel.',
      flowAria: 'Fluxo de selecao de area',
      flow: ['Busca de lugar', 'Caixa delimitadora', 'Registros GBIF'],
      mapAria: 'Esboco da area da caixa delimitadora',
      mapLabel: 'area selecionada',
    },
    data: {
      title: 'Quais dados do GBIF sao resumidos?',
      p1: 'O poster pede ao GBIF facetas compactas de ocorrencias com limit=0. Isso gera contagens e resumos agrupados sem baixar todos os registros.',
      p2: 'A consulta principal agrupa por mes, ano, conjunto de dados, reino e tipo de evidencia. Consultas menores montam grupos candidatos de especies, conservacao e temas.',
      queryAria: 'Esboco da consulta resumida do GBIF',
      countFacets: 'contagem + facetas',
      arrow: 'facetas viram cartoes',
      signals: ['Mes', 'Ano', 'Reino', 'Conjunto de dados', 'Tipo de evidencia'],
    },
    species: {
      title: 'Como as especies sao selecionadas?',
      p1: 'As especies em destaque vêm de grandes posicoes taxonomicas. Cada posicao pede ao GBIF as especies locais mais registradas nessa classe ou reino.',
      p2: 'Bee Around mantem um pequeno grupo principal, remove candidatos pouco representados e entao usa a semente do poster para escolher uma mistura repetivel.',
      groups: ['Mamifero', 'Ave', 'Inseto', 'Planta com flor', 'Arvore ou samambaia', 'Fungo'],
      arrow: 'principais candidatos locais',
      boardAria: 'Esboco de selecao de posicoes de especies',
      boardLabels: ['Ave', 'Inseto', 'Planta'],
    },
    labels: {
      title: 'O que significam os rotulos do poster?',
      season: 'Na temporada - junho',
      seasonDescription: 'Gerado a partir das principais especies registradas no mes calendario atual.',
      small: 'Pequena maravilha',
      smallDescription: 'Gerado a partir dos principais candidatos locais de insetos e fungos.',
      night: 'Criatura noturna',
      nightDescription: 'Gerado a partir dos principais candidatos locais entre morcegos, corujas, mariposas, vagalumes e grupos relacionados.',
      risk: 'Em risco - CR',
      riskDescription: 'Escolhido entre as principais especies locais no maior grupo de risco IUCN disponivel.',
      signature: 'Assinatura - 12x',
      signatureDescription: 'Escolhido entre especies cuja participacao local no GBIF e alta em relacao a base global.',
    },
    photos: {
      title: 'Como as fotos sao escolhidas?',
      p1: 'A identidade da especie e escolhida primeiro a partir dos dados do GBIF. As imagens sao uma camada de fallback de melhor esforco adicionada depois.',
      p2: 'As fontes sao testadas por ordem de prioridade. Se nenhuma imagem resolver, a especie permanece e o cartao usa um placeholder.',
      fallbackAria: 'Prioridade de fallback de fotos',
      steps: ['Correspondencia exata do iNaturalist', 'Chave GBIF Wikidata / Commons', 'Midia de especie do GBIF'],
      firstMatchWins: 'primeira correspondencia vence',
    },
    comparison: {
      title: 'Como a comparacao funciona?',
      p1: 'Um notebook resolve cidades e paises curados, depois consulta facetas do GBIF para cada caixa delimitadora.',
      p2: 'Ele calcula area, densidade de registros, proporcao ameacada e contagens de especies unicas, entao ranqueia linhas dentro de coortes de cidade ou pais. O app leva o arquivo enxuto de percentis.',
      flowAria: 'Fluxo de pre-computacao',
      flow: ['lugares', 'facetas', 'percentis'],
      barsAria: 'Barras de comparacao de exemplo',
      recordingIntensity: 'Intensidade de registro',
      threatenedShare: 'Proporcao ameacada',
    },
    regenerate: {
      title: 'Por que Regenerar continua repetivel?',
      p1: 'Todo poster tem uma semente. Regenerar muda a semente, alternando candidatos principais elegiveis e posicoes de cartoes desbloqueados.',
      p2: 'As especies sao deduplicadas entre cartoes, e links compartilhados guardam lugar, semente, tema, idioma e bloqueios.',
      seed1: 'Semente 1',
      seed2: 'Semente 2',
      shareUrl: 'URL de compartilhamento',
    },
    credits: {
      title: 'De onde vêm os creditos?',
      p: 'Nomes de especies, taxonomia, contagens de ocorrencia, metadados de conjuntos de dados e links de especies do GBIF vêm do GBIF. Creditos e licencas de fotos aparecem quando a fonte da imagem os fornece.',
      dataAndAttribution: 'Dados e atribuicao',
    },
  },
}

function AboutPage({ onBack, language }: Props) {
  const docsBaseUrl = 'https://github.com/enesdikmen/bee-around/blob/main'
  const developerImageSrc = `${import.meta.env.BASE_URL}me.jpeg`
  const designerImageSrc = `${import.meta.env.BASE_URL}hasan.png`
  const text = ABOUT_TEXT[normalizeUiLanguage(language)]

  return (
    <section className="about-page" aria-labelledby="about-page-title">
      <div className="about-content">
        <button type="button" className="about-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {text.back}
        </button>

        <section className="about-top-row">
          <section className="about-card about-hero-card">
            <p className="about-kicker">{text.kicker}</p>
            <h1 id="about-page-title">Bee Around</h1>
            <p>{text.description}</p>
            <div className="about-github-links" aria-label={text.docLinksAria}>
              <a href={`${docsBaseUrl}/README.md`} target="_blank" rel="noopener noreferrer">
                <GitHubIcon />
                README
              </a>
              <a href={`${docsBaseUrl}/docs/how-it-works.md`} target="_blank" rel="noopener noreferrer">
                <GitHubIcon />
                {text.howItWorks}
              </a>
              <a href={`${docsBaseUrl}/docs/data-and-attribution.md`} target="_blank" rel="noopener noreferrer">
                <GitHubIcon />
                {text.dataNotes}
              </a>
            </div>
          </section>

          <div className="about-team-cards" aria-label={text.teamAria}>
            <article
              className="about-developer-card bento-card bento-card--mini accent-paper"
              aria-label={text.developerCardAria}
            >
              <img className="bento-mini__img about-developer-card__empty-image" src={developerImageSrc} alt="Enes Dikmen" />
              <span className="bento-mini__name">Enes Dikmen</span>
              <span className="bento-mini__sci">Homo sapiens</span>
              <span className="bento-mini__count">1</span>
              <span className="bento-mini__ribbon">{text.developer}</span>
            </article>
            <article
              className="about-developer-card bento-card bento-card--mini accent-paper"
              aria-label={text.designerCardAria}
            >
              <img className="bento-mini__img about-developer-card__empty-image" src={designerImageSrc} alt="Hasan Yalçınkaya" />
              <span className="bento-mini__name">Hasan Yalçınkaya</span>
              <span className="bento-mini__sci">Homo sapiens</span>
              <span className="bento-mini__count">1</span>
              <span className="bento-mini__ribbon">{text.designer}</span>
            </article>
          </div>
        </section>

        <section className="about-grid about-grid--story">
          <article className="about-card about-topic about-topic--wide">
            <div className="about-topic__head">
              <span className="about-topic__mark">01</span>
              <h2>{text.area.title}</h2>
            </div>
            <div className="about-split about-split--area">
              <div className="about-copy">
                <p>{text.area.p1}</p>
                <p>
                  {text.area.p2.split('country=XX')[0]}
                  <code>country=XX</code>
                  {text.area.p2.split('country=XX')[1]}
                </p>
              </div>
              <div className="about-logic-panel">
                <div className="about-flow" aria-label={text.area.flowAria}>
                  {text.area.flow.map((step) => (
                    <span key={step}>{step}</span>
                  ))}
                </div>
                <div className="about-map-card" aria-label={text.area.mapAria}>
                  <span className="about-map-card__grid" />
                  <span className="about-map-card__bbox" />
                  <span className="about-map-card__pin" />
                  <span className="about-map-card__label">{text.area.mapLabel}</span>
                </div>
              </div>
            </div>
          </article>

          <article className="about-card about-topic about-topic--wide">
            <div className="about-topic__head">
              <span className="about-topic__mark">02</span>
              <h2>{text.data.title}</h2>
            </div>
            <div className="about-split about-split--data">
              <div className="about-copy">
                <p>
                  {text.data.p1.split('limit=0')[0]}
                  <code>limit=0</code>
                  {text.data.p1.split('limit=0')[1]}
                </p>
                <p>{text.data.p2}</p>
              </div>
              <div className="about-logic-panel about-logic-panel--dark">
                <div className="about-query-card" aria-label={text.data.queryAria}>
                  <span>occurrence/search</span>
                  <b>limit=0</b>
                  <small>{text.data.countFacets}</small>
                </div>
                <span className="about-arrow-label">{text.data.arrow}</span>
                <div className="about-chip-cloud about-chip-cloud--connected">
                  {text.data.signals.map((signal) => (
                    <span key={signal}>{signal}</span>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className="about-card about-topic about-topic--wide">
            <div className="about-topic__head">
              <span className="about-topic__mark">03</span>
              <h2>{text.species.title}</h2>
            </div>
            <div className="about-split about-split--species">
              <div className="about-copy">
                <p>{text.species.p1}</p>
                <p>{text.species.p2}</p>
              </div>
              <div className="about-logic-panel">
                <div className="about-chip-cloud about-chip-cloud--groups">
                  {text.species.groups.map((group) => (
                    <span key={group}>{group}</span>
                  ))}
                </div>
                <span className="about-arrow-label">{text.species.arrow}</span>
                <div className="about-species-board" aria-label={text.species.boardAria}>
                  {text.species.boardLabels.map((label, index) => (
                    <div key={label}>
                      <span>{label}</span>
                      <i className={index === 1 ? 'is-picked' : undefined} />
                      <i />
                      <i />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className="about-card about-topic about-topic--labels">
            <div className="about-topic__head">
              <span className="about-topic__mark">04</span>
              <h2>{text.labels.title}</h2>
            </div>
            <div className="about-label-list">
              <div>
                <span className="about-poster-label about-poster-label--season">{text.labels.season}</span>
                <p>{text.labels.seasonDescription}</p>
              </div>
              <div>
                <span className="about-poster-label about-poster-label--small">{text.labels.small}</span>
                <p>{text.labels.smallDescription}</p>
              </div>
              <div>
                <span className="about-poster-label about-poster-label--night">{text.labels.night}</span>
                <p>{text.labels.nightDescription}</p>
              </div>
              <div>
                <span className="about-poster-label about-poster-label--risk">{text.labels.risk}</span>
                <p>{text.labels.riskDescription}</p>
              </div>
              <div>
                <span className="about-poster-label about-poster-label--signature">{text.labels.signature}</span>
                <p>{text.labels.signatureDescription}</p>
              </div>
            </div>
          </article>

          <article className="about-card about-topic">
            <div className="about-topic__head">
              <span className="about-topic__mark">05</span>
              <h2>{text.photos.title}</h2>
            </div>
            <div className="about-copy">
              <p>{text.photos.p1}</p>
              <p>{text.photos.p2}</p>
            </div>
            <div className="about-connected-block">
              <div className="about-fallback-list" aria-label={text.photos.fallbackAria}>
                {text.photos.steps.map((step) => (
                  <span key={step}>{step}</span>
                ))}
                <b>{text.photos.firstMatchWins}</b>
              </div>
            </div>
          </article>

          <article className="about-card about-topic">
            <div className="about-topic__head">
              <span className="about-topic__mark">06</span>
              <h2>{text.comparison.title}</h2>
            </div>
            <div className="about-copy">
              <p>{text.comparison.p1}</p>
              <p>{text.comparison.p2}</p>
            </div>
            <div className="about-connected-block">
              <div className="about-precompute-flow" aria-label={text.comparison.flowAria}>
                {text.comparison.flow.map((step) => (
                  <span key={step}>{step}</span>
                ))}
              </div>
              <div className="about-meter-set" aria-label={text.comparison.barsAria}>
                <div>
                  <span>{text.comparison.recordingIntensity}</span>
                  <b style={{ width: '78%' }} />
                </div>
                <div>
                  <span>{text.comparison.threatenedShare}</span>
                  <b style={{ width: '46%' }} />
                </div>
              </div>
            </div>
          </article>

          <article className="about-card about-topic">
            <div className="about-topic__head">
              <span className="about-topic__mark">07</span>
              <h2>{text.regenerate.title}</h2>
            </div>
            <div className="about-copy">
              <p>{text.regenerate.p1}</p>
              <p>{text.regenerate.p2}</p>
            </div>
            <div className="about-connected-block">
              <div className="about-seed-row">
                <span>{text.regenerate.seed1}</span>
                <span>{text.regenerate.seed2}</span>
                <span>{text.regenerate.shareUrl}</span>
              </div>
            </div>
          </article>

          <article className="about-card about-topic">
            <div className="about-topic__head">
              <span className="about-topic__mark">08</span>
              <h2>{text.credits.title}</h2>
            </div>
            <p>{text.credits.p}</p>
            <div className="about-doc-links">
              <a href={`${docsBaseUrl}/docs/how-it-works.md`}>
                {text.howItWorks}
              </a>
              <a href={`${docsBaseUrl}/docs/data-and-attribution.md`}>
                {text.credits.dataAndAttribution}
              </a>
            </div>
          </article>
        </section>
      </div>
    </section>
  )
}

function GitHubIcon() {
  return (
    <svg
      aria-hidden="true"
      className="about-github-icon"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="currentColor"
    >
      <path d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.93.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 7c.85 0 1.7.12 2.5.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.95.68 1.92 0 1.38-.01 2.5-.01 2.84 0 .27.18.59.69.49A10.25 10.25 0 0 0 22 12.25C22 6.59 17.52 2 12 2Z" />
    </svg>
  )
}

export default AboutPage
