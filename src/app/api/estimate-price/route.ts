import { NextRequest, NextResponse } from "next/server";

type PriceEstimate = {
  min: number;
  max: number;
  summary: string;
  tip?: string;
  sells?: string;
};

const priceCache = new Map<string, { expiresAt: number; data: PriceEstimate }>();

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const name = searchParams.get("name")?.trim();
  const category = searchParams.get("category")?.trim() || "food";
  const address = searchParams.get("address")?.trim() || "Tokyo, Japan";
  const lang = searchParams.get("lang") || "id";

  if (!name) {
    return NextResponse.json({ error: "Nama tempat diperlukan." }, { status: 400 });
  }

  const cacheKey = `${name.toLowerCase()}:${lang}`;
  const cached = priceCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const apiKey = process.env.GEMINI_API_KEY;

  const categoryDefaults: Record<string, PriceEstimate> = {
    food: {
      min: 850,
      max: 1800,
      sells:
        lang === "ja"
          ? "日本料理・ラーメン・定食・軽食など各種お食事メニュー"
          : lang === "en"
            ? "Authentic meals, lunch sets, ramen bowls, and local delicacies"
            : "Aneka hidangan khas Jepang, set menu makan siang, ramen, dan masakan lokal",
      summary:
        lang === "ja"
          ? "一般的な食事の価格帯（約850〜1,800円/人）"
          : lang === "en"
            ? "Standard meal price range (~¥850 - ¥1,800/person)"
            : "Kisaran makan standar di Jepang (sekitar ¥850 - ¥1.800 per orang)",
      tip:
        lang === "ja"
          ? "券売機がある場合は千円札や小銭を用意しておくとスムーズです。"
          : lang === "en"
            ? "Bring 1,000 yen cash notes or coins for ticket vending machines."
            : "Sediakan uang tunai pecahan ¥1.000 atau koin jika memesan via mesin tiket.",
    },
    cafe: {
      min: 450,
      max: 1200,
      sells:
        lang === "ja"
          ? "自家焙煎コーヒー、カフェラテ、トースト、パフェ、ケーキ"
          : lang === "en"
            ? "Artisan coffee, espresso, breakfast toasts, parfaits, and cakes"
            : "Kopi espresso, latte, toast sarapan, pancake, dan dessert manis",
      summary:
        lang === "ja"
          ? "コーヒー・スイーツの価格帯（約450〜1,200円）"
          : lang === "en"
            ? "Coffee & desserts price range (~¥450 - ¥1,200)"
            : "Kisaran kopi dan camilan kafe (sekitar ¥450 - ¥1.200)",
      tip:
        lang === "ja"
          ? "朝の時間帯はトーストが付くモーニングサービスがお得です。"
          : lang === "en"
            ? "Morning sets before 11 AM often offer great value."
            : "Paket morning set sebelum jam 11 siang biasanya lebih hemat.",
    },
    convenience: {
      min: 150,
      max: 850,
      sells:
        lang === "ja"
          ? "おにぎり、お弁当、揚げ物（ファミチキ等）、冷たいドリンク、ATM、日用品"
          : lang === "en"
            ? "Onigiri rice balls, hot bento boxes, fried chicken, cold drinks, ATM, and snacks"
            : "Nasi onigiri segar, bento siap santap, fried chicken, minuman dingin, ATM, dan kebutuhan harian",
      summary:
        lang === "ja"
          ? "おにぎり・お弁当等の価格帯（約150〜850円）"
          : lang === "en"
            ? "Quick snacks & bento price range (~¥150 - ¥850)"
            : "Onigiri, minuman & bento konbini (sekitar ¥150 - ¥850)",
      tip:
        lang === "ja"
          ? "Suica / Pasmoなどの交通系ICカードでスムーズに決済できます。"
          : lang === "en"
            ? "IC cards (Suica/Pasmo) are accepted for instant contactless payment."
            : "Bisa bayar praktis pakai kartu IC seperti Suica atau Pasmo.",
    },
    supermarket: {
      min: 300,
      max: 2000,
      sells:
        lang === "ja"
          ? "新鮮な果物、お惣菜、パン、お菓子、飲料、お土産用食品"
          : lang === "en"
            ? "Fresh fruits, ready-to-eat bento, bakery goods, snacks, and local groceries"
            : "Buah segar, bento lauk pauk siap saji berdiskon malam, snack, dan minuman",
      summary:
        lang === "ja"
          ? "生鮮食品・お惣菜の価格帯"
          : lang === "en"
            ? "Groceries & ready-to-eat meals price range"
            : "Makanan siap santap & belanja kebutuhan harian",
      tip:
        lang === "ja"
          ? "夜19時以降はお惣菜に割引シールが貼られることが多いです。"
          : lang === "en"
            ? "Look for discount stickers on bentos after 7 PM."
            : "Lewat jam 7 malam sering ada stiker diskon (20% - 50%) untuk bento siap makan.",
    },
    drugstore: {
      min: 350,
      max: 3000,
      sells:
        lang === "ja"
          ? "旅行用常備薬、目薬、休足時間、日本の人気コスメ、スキンケア、サプリ"
          : lang === "en"
            ? "Travel medicine, cooling foot pads, Japanese skincare, cosmetics, and vitamins"
            : "Obat flu/pusing travel, koyo pereda kaki lelah, skincare Jepang, kosmetik bebas pajak, dan vitamin",
      summary:
        lang === "ja"
          ? "医薬品・コスメ・日用品の価格帯"
          : lang === "en"
            ? "Medicine, cosmetics & travel essentials price range"
            : "Obat, kosmetik & kebutuhan harian wisatawan",
      tip:
        lang === "ja"
          ? "5,000円以上の購入とパスポート提示で免税（Tax-Free）が利用可能です。"
          : lang === "en"
            ? "Tax-free shopping often available above ¥5,000 with your passport."
            : "Bisa bebas pajak (Tax-Free) dengan paspor untuk belanja di atas ¥5.000.",
    },
    shopping: {
      min: 1000,
      max: 6000,
      sells:
        lang === "ja"
          ? "日本限定のお土産、キャラクターグッズ、衣料品、人気スナック菓子"
          : lang === "en"
            ? "Japan-exclusive souvenirs, anime merchandise, fashion, and snack gifts"
            : "Suvenir oleh-oleh khas Jepang, pakaian tren, KitKat rasa unik, dan aksesoris",
      summary:
        lang === "ja"
          ? "お土産・衣料品の一般的な価格帯"
          : lang === "en"
            ? "Souvenirs, fashion & goods price range"
            : "Suvenir, pakaian & belanja oleh-oleh",
    },
    electronics: {
      min: 1500,
      max: 15000,
      sells:
        lang === "ja"
          ? "旅行用SIM/eSIM、変換プラグ、モバイルバッテリー、カメラ、オーディオ機器"
          : lang === "en"
            ? "Tourist SIM/eSIMs, travel adapters, power banks, cameras, and headphones"
            : "SIM card turis/eSIM, travel adapter, power bank, kamera, headphone, dan gadget",
      summary:
        lang === "ja"
          ? "ガジェット・周辺機器の価格帯"
          : lang === "en"
            ? "Gadgets, adapters & electronics price range"
            : "Aksesoris smartphone, adaptor charger & elektronik",
    },
    other: {
      min: 500,
      max: 2000,
      sells:
        lang === "ja"
          ? "史跡の拝観、庭園見学、展望台入場、記念お守りや御朱印"
          : lang === "en"
            ? "Historic landmarks, scenic gardens, observation views, and omamori charms"
            : "Spot foto pemandangan, wisata budaya sejarah Jepang, taman asri, dan suvenir khas",
      summary:
        lang === "ja"
          ? "観光地・施設の入場料目安"
          : lang === "en"
            ? "Admission fee or tourist activity estimate"
            : "Perkiraan tiket masuk atau biaya singgah tempat wisata",
    },
  };

  if (!apiKey) {
    const fallback = categoryDefaults[category] || categoryDefaults.food;
    return NextResponse.json(fallback);
  }

  const prompt = `You are a helpful travel expense and food expert for visitors in Japan.
Analyze this place in Japan:
Place Name: '${name}'
Category: '${category}'
Address: '${address}'

Respond with ONLY a valid JSON object matching this schema:
{
  "min": number,
  "max": number,
  "sells": string,
  "summary": string,
  "tip": string
}
Requirements:
1. "sells": Write 1 concise sentence clearly describing WHAT THIS PLACE SELLS or its signature dishes/products (e.g. "Menjual aneka ramen tonkotsu kental, mie tsukemen, chashu don, dan gyoza goreng.").
2. "summary": Detailed price range and dining/shopping description.
3. "tip": A practical, helpful ordering or visiting tip for tourists.
4. "min" and "max": Integer numbers representing realistic average expenses in Japanese Yen (JPY) per person (e.g. 900, 1500).
5. All text fields ("sells", "summary", "tip") MUST be written in ${
    lang === "ja" ? "Japanese" : lang === "en" ? "English" : "Indonesian"
  }.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(6500),
    });

    if (res.ok) {
      const json = await res.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText) as PriceEstimate;
        if (Number.isFinite(parsed.min) && Number.isFinite(parsed.max)) {
          priceCache.set(cacheKey, { expiresAt: Date.now() + 2 * 3600 * 1000, data: parsed });
          return NextResponse.json(parsed);
        }
      }
    }
  } catch {}

  const fallback = categoryDefaults[category] || categoryDefaults.food;
  return NextResponse.json(fallback);
}
