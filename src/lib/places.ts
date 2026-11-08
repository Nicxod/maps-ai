import openingHours from "opening_hours";

export type Place = {
  id: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  ratingCount?: number;
  price?: { min: number; max: number; source: string; updatedAt: string; verified: boolean };
  priceLevel?: number;
  openNow?: boolean;
  operationalStatus?: "open" | "closing_soon" | "closed" | "opening_soon" | "hours_unavailable";
  hours?: string[];
  website?: string;
  distanceMeters?: number;
  walkingMeters?: number;
  walkingSeconds?: number;
  photo?: string;
};

type CategoryConfig = {
  labels: Record<string, string>;
  amenity?: string;
  shop?: string;
  tourism?: string;
  searchTerm: string;
};

const categoryConfigs: Record<string, CategoryConfig> = {
  food: {
    labels: { id: "Tempat makan", en: "Dining", ja: "飲食店" },
    amenity: "restaurant",
    searchTerm: "restaurant",
  },
  cafe: {
    labels: { id: "Kafe", en: "Cafe", ja: "カフェ" },
    amenity: "cafe",
    searchTerm: "cafe",
  },
  convenience: {
    labels: { id: "Konbini", en: "Convenience store", ja: "コンビニ" },
    shop: "convenience",
    searchTerm: "convenience",
  },
  supermarket: {
    labels: { id: "Supermarket", en: "Supermarket", ja: "スーパー" },
    shop: "supermarket",
    searchTerm: "supermarket",
  },
  drugstore: {
    labels: { id: "Apotek", en: "Pharmacy", ja: "薬局" },
    amenity: "pharmacy",
    searchTerm: "pharmacy",
  },
  shopping: {
    labels: { id: "Belanja", en: "Shopping", ja: "ショッピング" },
    shop: "department_store",
    searchTerm: "shopping",
  },
  electronics: {
    labels: { id: "Toko elektronik", en: "Electronics", ja: "家電" },
    shop: "electronics",
    searchTerm: "electronics",
  },
  other: {
    labels: { id: "Tempat menarik", en: "Attractions", ja: "観光スポット" },
    tourism: "attraction",
    searchTerm: "attraction",
  },
};

const cache = new Map<string, { expiresAt: number; places: Place[] }>();

export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (n: number) => (n * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function tokyoWallClockDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const wallClockUtc = Date.UTC(+values.year, +values.month - 1, +values.day, +values.hour, +values.minute);
  const localOffset = new Date(wallClockUtc).getTimezoneOffset();
  return new Date(wallClockUtc + localOffset * 60_000);
}

function parseOpeningHours(raw: string | undefined, lat: number, lng: number) {
  if (!raw) return { hours: undefined, openNow: undefined, status: "hours_unavailable" as const };
  try {
    const schedule = new openingHours(raw, {
      lat,
      lon: lng,
      address: { country_code: "jp", state: "" },
    });
    const now = tokyoWallClockDate();
    const isOpen = schedule.getState(now);
    const nextChange = schedule.getNextChange(now, new Date(now.getTime() + 36 * 60 * 60 * 1000));
    const withinThirtyMinutes = nextChange !== undefined && nextChange.getTime() - now.getTime() <= 30 * 60 * 1000;
    const unknown = schedule.getUnknown(now);
    const status = unknown
      ? "hours_unavailable"
      : isOpen
        ? withinThirtyMinutes ? "closing_soon" : "open"
        : withinThirtyMinutes ? "opening_soon" : "closed";
    return { hours: [raw], openNow: unknown ? undefined : isOpen, status };
  } catch {
    return { hours: [raw], openNow: undefined, status: "hours_unavailable" as const };
  }
}

type NominatimItem = {
  place_id: number;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  extratags?: Record<string, string>;
  address?: Record<string, string>;
};

export async function searchPlaces(
  lat: number,
  lng: number,
  radius: number,
  categoryId: string,
  lang: string = "id"
): Promise<Place[]> {
  const category = categoryConfigs[categoryId] ?? categoryConfigs.food;
  const label = category.labels[lang] || category.labels.id;
  const cacheKey = `${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}:${categoryId}:${lang}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.places;

  const dLat = radius / 111000;
  const dLng = radius / (111000 * Math.cos((lat * Math.PI) / 180));
  const viewbox = `${lng - dLng},${lat + dLat},${lng + dLng},${lat - dLat}`;

  const origin = { lat, lng };
  const placesMap = new Map<string, Place>();

  const acceptLang = lang === "ja" ? "ja,en;q=0.8" : lang === "en" ? "en,ja;q=0.8" : "id,en;q=0.8,ja;q=0.5";

  // Strategy 1: Nominatim with bounded viewbox
  try {
    const queryParams = new URLSearchParams({
      format: "jsonv2",
      bounded: "1",
      viewbox,
      limit: "25",
      addressdetails: "1",
      extratags: "1",
    });

    if (category.amenity) queryParams.set("amenity", category.amenity);
    else if (category.shop) queryParams.set("shop", category.shop);
    else if (category.tourism) queryParams.set("tourism", category.tourism);
    else queryParams.set("q", category.searchTerm);

    const nomUrl = `https://nominatim.openstreetmap.org/search?${queryParams.toString()}`;
    const res = await fetch(nomUrl, {
      headers: {
        "User-Agent": "NearMeJapanApp/1.0 (contact: support@nearme-japan.local)",
        "Accept-Language": acceptLang,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const rows = (await res.json()) as NominatimItem[];
      for (const row of rows) {
        const itemLat = Number(row.lat);
        const itemLng = Number(row.lon);
        if (!Number.isFinite(itemLat) || !Number.isFinite(itemLng)) continue;

        const dist = haversine(origin, { lat: itemLat, lng: itemLng });
        if (dist > radius * 1.25) continue;

        const name = row.name || row.display_name.split(",")[0].trim();
        const tags = row.extratags ?? {};
        const opening = parseOpeningHours(tags.opening_hours, itemLat, itemLng);

        const place: Place = {
          id: `osm-${row.osm_type}-${row.osm_id}`,
          name,
          category: label,
          address: row.display_name,
          lat: itemLat,
          lng: itemLng,
          website: tags.website ?? tags["contact:website"],
          ...opening,
          distanceMeters: Math.round(dist),
        };
        const key = `${name.toLowerCase()}:${itemLat.toFixed(3)}:${itemLng.toFixed(3)}`;
        placesMap.set(key, place);
      }
    }
  } catch {}

  // Strategy 2: Photon API as fallback/complement if places count is small
  if (placesMap.size < 5) {
    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(category.searchTerm)}&lat=${lat}&lon=${lng}&limit=20`;
      const pRes = await fetch(photonUrl, {
        headers: { "User-Agent": "NearMeJapanApp/1.0", "Accept-Language": acceptLang },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });

      if (pRes.ok) {
        const pData = await pRes.json();
        for (const feat of pData.features ?? []) {
          const coords = feat.geometry?.coordinates;
          if (!coords || coords.length < 2) continue;
          const [fLng, fLat] = coords;
          const dist = haversine(origin, { lat: fLat, lng: fLng });
          if (dist > radius) continue;

          const pProps = feat.properties ?? {};
          const name = pProps.name || label;
          const key = `${name.toLowerCase()}:${fLat.toFixed(3)}:${fLng.toFixed(3)}`;
          if (!placesMap.has(key)) {
            const addrParts = [
              pProps.street,
              pProps.district,
              pProps.city,
              pProps.state,
              pProps.country,
            ].filter(Boolean);

            placesMap.set(key, {
              id: `osm-${pProps.osm_type || "N"}-${pProps.osm_id || Math.round(Math.random() * 1e8)}`,
              name,
              category: label,
              address: addrParts.length ? addrParts.join(", ") : (lang === "ja" ? "検索エリア周辺の住所" : lang === "en" ? "Address around the search area" : "Alamat di sekitar area pencarian"),
              lat: fLat,
              lng: fLng,
              distanceMeters: Math.round(dist),
              operationalStatus: "hours_unavailable",
            });
          }
        }
      }
    } catch {}
  }

  const places = [...placesMap.values()]
    .sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity))
    .slice(0, 30);

  cache.set(cacheKey, { expiresAt: Date.now() + 5 * 60 * 1000, places });
  if (cache.size > 500) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }

  return places;
}

export async function addWalkingRoutes(origin: { lat: number; lng: number }, places: Place[]): Promise<Place[]> {
  const topCount = Math.min(8, places.length);
  const topPlaces = places.slice(0, topCount);
  const remainingPlaces = places.slice(topCount);

  const updatedTop = await Promise.all(
    topPlaces.map(async (p) => {
      const dist = p.distanceMeters ?? 0;
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${origin.lng},${origin.lat};${p.lng},${p.lat}?overview=false`;
        const res = await fetch(osrmUrl, {
          signal: AbortSignal.timeout(3000),
          headers: { "User-Agent": "NearMeJapanApp/1.0" },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.code === "Ok" && data.routes?.[0]) {
            return {
              ...p,
              walkingMeters: Math.round(data.routes[0].distance),
              walkingSeconds: Math.round(data.routes[0].duration),
            };
          }
        }
      } catch {}

      return {
        ...p,
        walkingMeters: Math.round(dist * 1.25),
        walkingSeconds: Math.max(60, Math.round((dist * 1.25) / 1.3)),
      };
    })
  );

  const updatedRemaining = remainingPlaces.map((p) => {
    const dist = p.distanceMeters ?? 0;
    return {
      ...p,
      walkingMeters: Math.round(dist * 1.25),
      walkingSeconds: Math.max(60, Math.round((dist * 1.25) / 1.3)),
    };
  });

  return [...updatedTop, ...updatedRemaining];
}
