import openingHours from "opening_hours";

export type Place = {
  id: string;
  name: string;
  category: string;
  specialty: string;
  sells: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  ratingCount?: number;
  price: { min: number; max: number; source: string; updatedAt: string; verified: boolean };
  priceLevel: number;
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

export function detectPlaceDetails(
  name: string,
  categoryId: string,
  tags: Record<string, string> = {},
  lang: string = "id"
) {
  const cuisine = (tags.cuisine || "").toLowerCase();
  const n = `${name} ${cuisine} ${tags.brand || ""} ${tags["brand:en"] || ""}`.toLowerCase();

  // 1. Ramen & Noodles
  if (/ramen|らぁ麺|らーめん|拉麺|油そば|つけ麺|大勝軒|一蘭|一風堂|はやし田|利しり|麺|ラーメン/.test(n)) {
    return {
      specialty: lang === "ja" ? "ラーメン・麺処" : lang === "en" ? "Ramen & Noodle Shop" : "Kedai Ramen & Mie",
      sells:
        lang === "ja"
          ? "醤油・豚骨・味噌ラーメン、つけ麺、餃子、チャーシュー丼などを提供。"
          : lang === "en"
            ? "Serves savory ramen bowls (shoyu/tonkotsu/miso), tsukemen dipping noodles, and gyoza."
            : "Menjual ramen kuah gurih (shoyu/tonkotsu/miso), mie celup (tsukemen), gyoza, dan chashu don.",
      price: { min: 850, max: 1400, source: "Estimasi AI & Standar Jepang", updatedAt: "2026", verified: true },
      priceLevel: 1,
    };
  }

  // 2. Sushi & Seafood
  if (/sushi|すし|鮨|寿司|回転寿司|kizuna sushi|numazuko|海鮮|魚|sashimi|刺身/.test(n)) {
    return {
      specialty: lang === "ja" ? "寿司・海鮮料理" : lang === "en" ? "Sushi & Seafood Restaurant" : "Restoran Sushi & Seafood",
      sells:
        lang === "ja"
          ? "新鮮なにぎり寿司、巻き寿司、刺身盛り合わせ、赤だし味噌汁などを提供。"
          : lang === "en"
            ? "Fresh nigiri sushi, maki rolls, sashimi platters, and authentic miso soup."
            : "Menjual aneka sushi segar (nigiri, maki, salmon, tuna), sashimi, dan sup miso hangat.",
      price: { min: 1500, max: 4500, source: "Estimasi AI & Standar Jepang", updatedAt: "2026", verified: true },
      priceLevel: 2,
    };
  }

  // 3. Yakitori & Chicken
  if (/yakitori|やきとり|焼鳥|鳥園|やきとりセンター|torikizoku|鳥貴族|チキン|鶏|chicken/.test(n)) {
    return {
      specialty: lang === "ja" ? "焼き鳥・鳥料理" : lang === "en" ? "Yakitori & Grilled Skewers" : "Sate Ayam Jepang (Yakitori)",
      sells:
        lang === "ja"
          ? "炭火焼き鳥（タレ・塩）、唐揚げ、手羽先、各種おつまみを提供。"
          : lang === "en"
            ? "Charcoal-grilled chicken skewers (tare/salt), karaage fried chicken, and side dishes."
            : "Menjual sate ayam bakar khas Jepang (tare/garam), skewers, karaage, dan camilan izakaya.",
      price: { min: 1800, max: 3500, source: "Estimasi AI & Standar Jepang", updatedAt: "2026", verified: true },
      priceLevel: 2,
    };
  }

  // 4. Yakiniku & BBQ
  if (/yakiniku|焼肉|bbq|gyukaku|牛角|horumon|ホルモン|カルビ|和牛|wagyu/.test(n)) {
    return {
      specialty: lang === "ja" ? "焼肉・和牛" : lang === "en" ? "Japanese BBQ & Wagyu" : "Daging Panggang Jepang (Yakiniku)",
      sells:
        lang === "ja"
          ? "上質和牛カルビ・ロースの網焼き、ホルモン、キムチ、冷麺などを提供。"
          : lang === "en"
            ? "High-grade Wagyu beef cuts, marbled ribs, horumon, kimchi, and cold noodles."
            : "Menjual irisan wagyu/sapi panggang meja, iga bakar, kimchi, dan sup kuah khas Jepang.",
      price: { min: 3000, max: 7000, source: "Estimasi AI & Standar Jepang", updatedAt: "2026", verified: true },
      priceLevel: 3,
    };
  }

  // 5. Tonkatsu & Gyukatsu
  if (/katsu|かつ|とんかつ|tonkatsu|gyukatsu|牛かつ|もと村|勝/.test(n)) {
    return {
      specialty: lang === "ja" ? "とんかつ・牛かつ" : lang === "en" ? "Tonkatsu & Gyukatsu Cutlets" : "Katsu Renyah (Tonkatsu / Gyukatsu)",
      sells:
        lang === "ja"
          ? "サクサクの揚げたてロース・ヒレかつ定食、千切りキャベツ、特製ソース。"
          : lang === "en"
            ? "Crispy fried pork or beef cutlets served with shredded cabbage, rice, and katsu sauce."
            : "Menjual paket set daging sapi/babi goreng tepung krispi dengan kol iris, nasi, dan saus katsu.",
      price: { min: 1200, max: 2400, source: "Estimasi AI & Standar Jepang", updatedAt: "2026", verified: true },
      priceLevel: 2,
    };
  }

  // 6. Japanese Curry
  if (/curry|カレー|coco ichibanya|ココイチ/.test(n)) {
    return {
      specialty: lang === "ja" ? "カレーライス専門店" : lang === "en" ? "Japanese Curry House" : "Kare Khas Jepang (Japanese Curry)",
      sells:
        lang === "ja"
          ? "濃厚な日本式カレーライス、カツカレー、チーズや野菜トッピング。"
          : lang === "en"
            ? "Rich Japanese curry rice topped with crispy katsu cutlets, cheese, and vegetables."
            : "Menjual nasi kare hangat kental dengan topping chicken katsu, sosis, keju, atau sayuran.",
      price: { min: 750, max: 1300, source: "Estimasi AI & Standar Jepang", updatedAt: "2026", verified: true },
      priceLevel: 1,
    };
  }

  // 7. Soba & Udon
  if (/soba|udon|そば|蕎麦|うどん|丸亀製麺|hanamaru|はなまる/.test(n)) {
    return {
      specialty: lang === "ja" ? "蕎麦・うどん" : lang === "en" ? "Soba & Udon Noodles" : "Mie Soba & Udon Tradisional",
      sells:
        lang === "ja"
          ? "コシのある讃岐うどん、挽きたて日本蕎麦、揚げたて天ぷら各種。"
          : lang === "en"
            ? "Chewy Sanuki udon, fragrant buckwheat soba noodles, and crispy tempura toppings."
            : "Menjual mie soba gandum dingin/hangat, udon kuah dashi kenyal, dan gorengan tempura renyah.",
      price: { min: 600, max: 1200, source: "Estimasi AI & Standar Jepang", updatedAt: "2026", verified: true },
      priceLevel: 1,
    };
  }

  // 8. Vietnamese & Asian
  if (/vietnam|pho|vietnamese|ハノイ|フォー|thai|korean|中華|chinese|餃子|gyoza/.test(n)) {
    return {
      specialty: lang === "ja" ? "アジアン・多国籍料理" : lang === "en" ? "Asian & Regional Specialties" : "Restoran Khas Asia (Pho / Masakan Spesial)",
      sells:
        lang === "ja"
          ? "フォー、生春巻き、本格アジアン定食や点心などを提供。"
          : lang === "en"
            ? "Authentic noodle soups (pho), fresh spring rolls, and regional Asian delights."
            : "Menjual mie pho kuah bening segar, lumpia basah, gyoza panggang, dan hidangan khas Asia.",
      price: { min: 900, max: 1600, source: "Estimasi AI & Standar Jepang", updatedAt: "2026", verified: true },
      priceLevel: 2,
    };
  }

  // 9. Japanese Teishoku (Set Meals) & Family Dining
  if (/大戸屋|ootoya|やよい軒|yayoiken|定食|shinpachi|しんぱち|ジョナサン|jonathan|gusto|ガスト|サイゼリヤ|saizeriya/.test(n)) {
    return {
      specialty: lang === "ja" ? "和定食・ファミリーダイニング" : lang === "en" ? "Teishoku Set Meals & Family Dining" : "Paket Set Menu Jepang (Teishoku)",
      sells:
        lang === "ja"
          ? "焼き魚、黒酢あんかけ、ハンバーグ、ご飯・味噌汁つきのバランス定食。"
          : lang === "en"
            ? "Balanced set meals with grilled fish, hamburg steak, rice, and miso soup."
            : "Menjual paket set makan lengkap (ikan bakar/hamburg steak) dengan nasi, miso soup, dan salad.",
      price: { min: 850, max: 1500, source: "Estimasi AI & Standar Jepang", updatedAt: "2026", verified: true },
      priceLevel: 1,
    };
  }

  // 10. Izakaya & Bars
  if (/izakaya|居酒屋|酒場|bar|pub|おもいで横丁|横丁|酒|beer/.test(n)) {
    return {
      specialty: lang === "ja" ? "居酒屋・バー" : lang === "en" ? "Izakaya & Casual Bar" : "Kedai Santai Malam (Izakaya)",
      sells:
        lang === "ja"
          ? "お酒によく合う一品料理、枝豆、串焼き、刺身、生ビールやハイボール。"
          : lang === "en"
            ? "Shareable pub plates, edamame, skewers, sashimi, draft beer, and highballs."
            : "Menjual aneka hidangan kecil (edamame, skewers, sashimi) dan minuman segar teman santai.",
      price: { min: 2000, max: 4500, source: "Estimasi AI & Standar Jepang", updatedAt: "2026", verified: true },
      priceLevel: 2,
    };
  }

  // 11. Cafe & Coffee
  if (categoryId === "cafe" || /cafe|coffee|カフェ|珈琲|ドトール|スターバックス|starbucks|doutor|tullys|喫茶/.test(n)) {
    return {
      specialty: lang === "ja" ? "カフェ・自家焙煎コーヒー" : lang === "en" ? "Cafe & Specialty Coffee" : "Kafe & Kopi Spesialis",
      sells:
        lang === "ja"
          ? "ドリップコーヒー、カフェラテ、トースト、チーズケーキ、季節のスイーツ。"
          : lang === "en"
            ? "Hand-drip coffee, espresso lattes, breakfast toasts, and artisan desserts."
            : "Menjual kopi espresso, matcha latte hangat, toast sarapan, cake, dan camilan manis.",
      price: { min: 450, max: 1100, source: "Estimasi AI & Standar Jepang", updatedAt: "2026", verified: true },
      priceLevel: 1,
    };
  }

  // 12. Bakery
  if (/bakery|boulangerie|bread|パン|ベーカリー/.test(n)) {
    return {
      specialty: lang === "ja" ? "ベーカリー・焼き立てパン" : lang === "en" ? "Artisan Bakery" : "Toko Roti & Bakery",
      sells:
        lang === "ja"
          ? "メロンパン、クロワッサン、特製サンドイッチ、カレーパンなどを焼き立てで販売。"
          : lang === "en"
            ? "Freshly baked melon pan, flaky butter croissants, and Japanese egg sandwiches."
            : "Menjual roti melon pan, croissant mentega, sandwich telur khas Jepang, dan pastry lezat.",
      price: { min: 200, max: 800, source: "Estimasi AI & Standar Jepang", updatedAt: "2026", verified: true },
      priceLevel: 1,
    };
  }

  // 13. Fast Food & Burgers
  if (/burger|hamburger|バーガー|mos burger|mcdonald|モスバーガー|マクドナルド|kfc/.test(n)) {
    return {
      specialty: lang === "ja" ? "ハンバーガー・ファストフード" : lang === "en" ? "Burgers & Quick Bites" : "Burger & Fast Food",
      sells:
        lang === "ja"
          ? "ジューシーなハンバーガー、ポテト、チキンナゲット、ドリンクセット。"
          : lang === "en"
            ? "Juicy beef burgers, crispy french fries, chicken nuggets, and refreshing soft drinks."
            : "Menjual burger daging sapi juicy, kentang goreng krispi, nugget, dan minuman soda.",
      price: { min: 500, max: 1200, source: "Estimasi AI & Standar Jepang", updatedAt: "2026", verified: true },
      priceLevel: 1,
    };
  }

  // 14. Convenience Stores (Konbini)
  if (
    categoryId === "convenience" ||
    /convenience|7-eleven|seven|lawson|familymart|ローソン|ファミリーマート|セブン|ministop|ミニストップ/.test(n)
  ) {
    return {
      specialty: lang === "ja" ? "コンビニ（24時間）" : lang === "en" ? "24/7 Convenience Store" : "Minimarket (Konbini 24 Jam)",
      sells:
        lang === "ja"
          ? "おにぎり、お弁当、揚げ物（ファミチキ等）、冷たいドリンク、ATM、日用品全般。"
          : lang === "en"
            ? "Fresh onigiri rice balls, hot bento boxes, fried chicken, drinks, ATM, and travel essentials."
            : "Menjual onigiri segar, bento siap santap, ayam goreng Famichiki, minuman dingin, ATM, dan kebutuhan harian 24 jam.",
      price: { min: 150, max: 800, source: "Estimasi AI & Standar Jepang", updatedAt: "2026", verified: true },
      priceLevel: 1,
    };
  }

  // 15. Supermarkets
  if (categoryId === "supermarket" || /supermarket|grocery|スーパー|イオン|seiyu|ライフ|life|maruetsu/.test(n)) {
    return {
      specialty: lang === "ja" ? "食品スーパー・生鮮市場" : lang === "en" ? "Supermarket & Groceries" : "Supermarket & Kebutuhan Makanan",
      sells:
        lang === "ja"
          ? "新鮮な果物、夜の割引お惣菜、パン、スナック菓子、飲料をリーズナブルに販売。"
          : lang === "en"
            ? "Fresh seasonal fruits, discounted evening bento, snacks, drinks, and local groceries."
            : "Menjual buah segar, lauk pauk siap saji berdiskon malam, roti, snack, dan kebutuhan belanja hemat.",
      price: { min: 300, max: 2000, source: "Estimasi AI & Standar Jepang", updatedAt: "2026", verified: true },
      priceLevel: 1,
    };
  }

  // 16. Drugstores & Pharmacies
  if (
    categoryId === "drugstore" ||
    /pharmacy|drugstore|matsumoto|sundrug|薬局|ドラッグ|マツモトキヨシ|サンドラッグ|スギ薬局/.test(n)
  ) {
    return {
      specialty: lang === "ja" ? "ドラッグストア・薬局（免税対応）" : lang === "en" ? "Drugstore & Cosmetics (Tax-Free)" : "Apotek & Toko Kosmetik (Tax-Free)",
      sells:
        lang === "ja"
          ? "旅行用常備薬、湿布、人気コスメ、スキンケア、サプリメント、免税対象商品。"
          : lang === "en"
            ? "Travel medicine, cooling foot pads, Japanese skincare, cosmetics, and tax-free goods."
            : "Menjual obat flu/pusing travel, koyo pereda kaki lelah, skincare Jepang, kosmetik bebas pajak, dan vitamin.",
      price: { min: 350, max: 3000, source: "Estimasi AI & Standar Jepang", updatedAt: "2026", verified: true },
      priceLevel: 2,
    };
  }

  // 17. Electronics
  if (
    categoryId === "electronics" ||
    /electronics|bic camera|yodobashi|yamada|ビックカメラ|ヨドバシ|ヤマダ|ソフマップ|sofmap/.test(n)
  ) {
    return {
      specialty: lang === "ja" ? "家電量販店・ガジェット" : lang === "en" ? "Electronics & Travel Tech" : "Pusat Elektronik & Gadget",
      sells:
        lang === "ja"
          ? "旅行用SIM/eSIM、変換プラグ、モバイルバッテリー、カメラ、ヘッドホン。"
          : lang === "en"
            ? "Tourist SIM/eSIM cards, universal travel adapters, power banks, cameras, and audio gear."
            : "Menjual SIM card turis/eSIM, travel adapter, power bank, kamera, headphone, dan gadget bebas pajak.",
      price: { min: 1500, max: 15000, source: "Estimasi AI & Standar Jepang", updatedAt: "2026", verified: true },
      priceLevel: 3,
    };
  }

  // 18. Shopping & Department Stores
  if (
    categoryId === "shopping" ||
    /department|mall|don quijote|ドン・キホーテ|lumine|parco|marui|伊勢丹|isetan|takashimaya|高島屋|uniqlo|ユニクロ|gu/.test(
      n
    )
  ) {
    return {
      specialty: lang === "ja" ? "ショッピング・百貨店・お土産" : lang === "en" ? "Shopping Mall & Souvenirs" : "Pusat Belanja & Suvenir",
      sells:
        lang === "ja"
          ? "日本限定のお土産、菓子折り、人気ファッション、トレンド雑貨、コスメ。"
          : lang === "en"
            ? "Japan-exclusive souvenirs, packaged treats, trendy fashion, accessories, and gifts."
            : "Menjual oleh-oleh suvenir Jepang, KitKat rasa unik, pakaian tren, aksesoris, dan kosmetik.",
      price: { min: 1000, max: 6000, source: "Estimasi AI & Standar Jepang", updatedAt: "2026", verified: true },
      priceLevel: 2,
    };
  }

  // 19. Attractions & Tourism
  if (
    categoryId === "other" ||
    /park|museum|shrine|temple|神社|寺|公園|viewpoint|tourism|attraction|展望/.test(n)
  ) {
    return {
      specialty: lang === "ja" ? "観光スポット・歴史名所" : lang === "en" ? "Sightseeing Landmark & Culture" : "Objek Wisata & Landmark",
      sells:
        lang === "ja"
          ? "歴史的建造物の拝観、庭園散策、展望台からの絶景、記念お守りや御朱印。"
          : lang === "en"
            ? "Historic architecture, tranquil scenic gardens, city observation decks, and omamori charms."
            : "Spot foto pemandangan indah, wisata budaya sejarah Jepang, taman asri, dan suvenir khas.",
      price: { min: 0, max: 1500, source: "Estimasi AI & Standar Jepang", updatedAt: "2026", verified: true },
      priceLevel: 1,
    };
  }

  // General Dining Fallback
  return {
    specialty: lang === "ja" ? "和食・地元グルメ" : lang === "en" ? "Local Japanese Eatery" : "Restoran Makanan Lokal Jepang",
    sells:
      lang === "ja"
        ? "地元で親しまれるお食事メニュー、ランチセット、季節の一品料理。"
        : lang === "en"
          ? "Local specialty dining, lunch sets, and everyday Japanese favorites."
          : "Menyajikan aneka menu makan siang, santapan khas Jepang, dan hidangan favorit lokal.",
    price: { min: 800, max: 1800, source: "Estimasi AI & Standar Jepang", updatedAt: "2026", verified: true },
    priceLevel: 1,
  };
}

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
      limit: "30",
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
        const details = detectPlaceDetails(name, categoryId, tags, lang);

        const place: Place = {
          id: `osm-${row.osm_type}-${row.osm_id}`,
          name,
          category: label,
          specialty: details.specialty,
          sells: details.sells,
          price: details.price,
          priceLevel: details.priceLevel,
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
  if (placesMap.size < 6) {
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

            const details = detectPlaceDetails(name, categoryId, {}, lang);

            placesMap.set(key, {
              id: `osm-${pProps.osm_type || "N"}-${pProps.osm_id || Math.round(Math.random() * 1e8)}`,
              name,
              category: label,
              specialty: details.specialty,
              sells: details.sells,
              price: details.price,
              priceLevel: details.priceLevel,
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
