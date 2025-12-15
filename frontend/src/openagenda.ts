// OpenAgenda API Service - Événements locaux
// Documentation: https://developers.openagenda.com/

export interface LocalEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  end_date?: string;
  event_type: 'local';
  location?: string;
  city?: string;
  department?: string;
  image_url?: string;
  source: 'openagenda';
}

interface OpenAgendaEvent {
  uid: number;
  slug: string;
  title: { fr: string };
  description?: { fr: string };
  longDescription?: { fr: string };
  image?: { base: string; filename: string };
  firstTiming?: { begin: string; end: string };
  nextTiming?: { begin: string; end: string };
  location?: {
    name?: string;
    city?: string;
    department?: string;
    postalCode?: string;
    address?: string;
  };
}

export interface OpenAgendaResponse {
  total: number;
  events: OpenAgendaEvent[];
}

// Liste des agendas publics populaires en France par région
export const REGIONAL_AGENDAS: Record<string, number[]> = {
  // Format: département -> liste d'UIDs d'agendas OpenAgenda
  'default': [
    // Agendas nationaux/généraux
    67683629, // Agenda culture France
  ]
};

/**
 * Convertit une adresse en coordonnées GPS via Nominatim (OpenStreetMap)
 * Note: Désactivé car CORS bloqué depuis le navigateur
 */
export async function geocodeAddress(_address: string): Promise<{ lat: number; lng: number } | null> {
  // Geocoding désactivé - on utilise la recherche par ville à la place
  // L'API Nominatim bloque les requêtes depuis localhost (CORS)
  return null;
}

/**
 * Extrait la ville et le département d'une adresse
 */
export function extractLocationInfo(address: string): { city?: string; department?: string; postalCode?: string } {
  if (!address) return {};

  console.log('📍 Extraction depuis adresse:', address);

  // Pattern 1: "15 rue de la Paix, 67000 Strasbourg"
  const postalCityMatch = address.match(/(\d{5})\s+([A-Za-zÀ-ÿ\s-]+)/);
  if (postalCityMatch) {
    const postalCode = postalCityMatch[1];
    const city = postalCityMatch[2].trim().split(',')[0].trim();
    const department = postalCode.substring(0, 2);
    console.log('📍 Pattern 1 (code postal + ville):', { city, postalCode, department });
    return { city, department, postalCode };
  }

  // Pattern 2: "Rue X, Ville, France" - chercher la ville avant "France"
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    // La ville est généralement l'avant-dernier élément (avant "France")
    let cityIndex = parts.length - 1;
    if (parts[parts.length - 1].toLowerCase() === 'france') {
      cityIndex = parts.length - 2;
    }
    const city = parts[cityIndex];
    if (city && city.length > 2 && !/^\d+$/.test(city)) {
      console.log('📍 Pattern 2 (ville avant France):', { city });
      return { city };
    }
  }

  // Pattern 3: Chercher le code postal n'importe où
  const postalMatch = address.match(/(\d{5})/);
  if (postalMatch) {
    const postalCode = postalMatch[1];
    const department = postalCode.substring(0, 2);
    console.log('📍 Pattern 3 (code postal seul):', { postalCode, department });
    return { postalCode, department };
  }

  // Pattern 4: Premier mot significatif
  const firstWord = parts[0];
  if (firstWord && firstWord.length > 2) {
    console.log('📍 Pattern 4 (premier élément):', { city: firstWord });
    return { city: firstWord };
  }

  return {};
}

/**
 * Recherche des événements locaux via OpenAgenda (Opendatasoft)
 */
export async function searchLocalEvents(
  address: string,
  options: {
    radiusKm?: number;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  } = {}
): Promise<LocalEvent[]> {
  const { limit = 20 } = options;
  const fromDate = options.fromDate || new Date();

  try {
    // Extraire les infos de localisation
    const locationInfo = extractLocationInfo(address);
    console.log('📍 OpenAgenda - Recherche pour:', address, locationInfo);

    const baseUrl = 'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/evenements-publics-openagenda/records';
    const fromDateStr = fromDate.toISOString().split('T')[0];

    // Fonction helper pour faire une requête
    const fetchEvents = async (refineParam: string, refineValue: string): Promise<any[]> => {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('where', `lastdate_end >= '${fromDateStr}'`);
      params.append('refine', `${refineParam}:${refineValue}`);
      params.append('order_by', 'firstdate_begin');

      const url = `${baseUrl}?${params.toString()}`;
      console.log('📍 URL API:', url);

      const response = await fetch(url);
      if (!response.ok) return [];

      const data = await response.json();
      console.log(`📍 Résultats pour ${refineParam}=${refineValue}:`, data.total_count, 'événements');
      return data.results || [];
    };

    let results: any[] = [];

    // Chercher uniquement par ville (pas d'élargissement)
    if (locationInfo.city) {
      results = await fetchEvents('location_city', locationInfo.city);

      if (results.length === 0) {
        console.log('📍 Aucun événement trouvé pour', locationInfo.city);
      }
    }

    // Convertir les résultats au format LocalEvent
    const events: LocalEvent[] = results.map((event: any) => ({
      id: `oa-${event.uid || event.slug}`,
      title: event.title_fr || 'Événement',
      description: event.description_fr || event.longdescription_fr || '',
      event_date: event.firstdate_begin || new Date().toISOString(),
      end_date: event.lastdate_end,
      event_type: 'local' as const,
      location: event.location_name,
      city: event.location_city || locationInfo.city,
      department: event.location_department,
      image_url: event.image || event.thumbnail,
      source: 'openagenda' as const
    }));

    console.log('📍 Événements formatés:', events.length);
    return events;
  } catch (error) {
    console.error('❌ Erreur recherche événements locaux:', error);
    return [];
  }
}

/**
 * Recherche alternative via l'API Data.gouv.fr pour les événements culturels
 */
export async function searchDataGouvEvents(
  city: string,
  options: { limit?: number } = {}
): Promise<LocalEvent[]> {
  const { limit = 10 } = options;

  try {
    // API des événements culturels data.gouv.fr
    const url = `https://data.culture.gouv.fr/api/explore/v2.1/catalog/datasets/panorama-des-festivals/records?limit=${limit}&refine=commune:${encodeURIComponent(city)}`;

    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();

    return (data.results || []).map((event: any) => ({
      id: `dg-${event.recordid}`,
      title: event.nom_du_festival || event.nom,
      description: event.discipline_dominante || '',
      event_date: event.date_debut || new Date().toISOString(),
      event_type: 'local' as const,
      location: event.nom_de_la_commune,
      city: event.commune,
      department: event.departement,
      source: 'openagenda' as const
    }));
  } catch (error) {
    console.error('Erreur Data.gouv:', error);
    return [];
  }
}

/**
 * Combine plusieurs sources d'événements locaux
 */
export async function getAllLocalEvents(
  address: string,
  options: { limit?: number; fromDate?: Date; toDate?: Date } = {}
): Promise<LocalEvent[]> {
  const locationInfo = extractLocationInfo(address);

  // Rechercher en parallèle sur plusieurs sources
  const [openAgendaEvents, dataGouvEvents] = await Promise.all([
    searchLocalEvents(address, options),
    locationInfo.city ? searchDataGouvEvents(locationInfo.city, { limit: options.limit }) : Promise.resolve([])
  ]);

  // Combiner et dédupliquer par titre similaire
  const allEvents = [...openAgendaEvents, ...dataGouvEvents];
  const uniqueEvents = allEvents.filter((event, index, self) =>
    index === self.findIndex(e =>
      e.title.toLowerCase().trim() === event.title.toLowerCase().trim()
    )
  );

  // Trier par date
  uniqueEvents.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  return uniqueEvents.slice(0, options.limit || 20);
}
