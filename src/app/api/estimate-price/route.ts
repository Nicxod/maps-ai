import { NextRequest, NextResponse } from "next/server";

type PriceEstimate = {
  min: number;
  max: number;
  summary: string;
  tip?: string;
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
      min: 800,
      max: 1800,
      summary:
        lang === "ja"
          ? "一般的な食事の価格帯（約800〜1,800円/人）"
          : lang === "en"
            ? "Standard meal price range (~¥800 - ¥1,800/person)"
            : "Kisaran makan standar di Jepang (sekitar ¥800 - ¥1.800 per orang)",
      tip:
        lang === "ja"
          ? "券売機がある場合は現金（千円札・小銭）を用意しておくと便利です。"
          : lang === "en"
            ? "Bring 1,000 yen cash notes or coins for ticket vending machines."
            : "Sediakan uang tunai pecahan ¥1.000 atau koin jika memesan via mesin tiket.",
    },
    cafe: {
      min: 450,
      max: 1200,
      summary:
        lang === "ja"
          ? "コーヒー・スイーツの価格帯（約450〜1,200円）"
          : lang === "en"
            ? "Coffee & desserts price range (~¥450 - ¥1,200)"
            : "Kisaran kopi dan camilan kafe (sekitar ¥450 - ¥1.200)",
      tip:
        lang === "ja"
          ? "モーニングセット（朝の時間帯）はお得な場合があります。"
          : lang === "en"
            ? "Morning sets before 11 AM often offer great value."
            : "Paket morning set sebelum jam 11 siang biasanya lebih hemat.",
    },
    convenience: {
      min: 150,
      max: 800,
      summary:
        lang === "ja"
          ? "おにぎり・お弁当等の価格帯（約150〜800円）"
          : lang === "en"
            ? "Quick snacks & bento price range (~¥150 - ¥800)"
            : "Onigiri, minuman & bento konbini (sekitar ¥150 - ¥800)",
      tip:
        lang === "ja"
          ? "ICカード（Suica / Pasmo）で素早く支払いができます。"
          : lang === "en"
            ? "IC cards (Suica/Pasmo) are accepted for instant contactless payment."
            : "Bisa bayar praktis pakai kartu IC seperti Suica atau Pasmo.",
    },
    supermarket: {
      min: 300,
      max: 2000,
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
      min: 250,
      max: 2500,
      summary:
        lang === "ja"
          ? "医薬品・コスメ・日用品の価格帯"
          : lang === "en"
            ? "Medicine, cosmetics & travel essentials price range"
            : "Obat, kosmetik & kebutuhan harian wisatawan",
      tip:
        lang === "ja"
          ? "パスポート提示で免税（Tax-Free）が適用される店舗もあります。"
          : lang === "en"
            ? "Tax-free shopping often available above ¥5,000 with your passport."
            : "Bisa bebas pajak (Tax-Free) dengan paspor untuk belanja di atas ¥5.000.",
    },
    shopping: {
      min: 1000,
      max: 8000,
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
      summary:
        lang === "ja"
          ? "ガジェット・周辺機器の価格帯"
          : lang === "en"
            ? "Gadgets, adapters & electronics price range"
            : "Aksesoris smartphone, adaptor charger & elektronik",
    },
    other: {
      min: 500,
      max: 2500,
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

  const prompt = `You are a helpful travel expense expert for visitors in Japan.
Estimate the realistic typical price range in Japanese Yen (JPY) per person for visiting this place:
Place Name: '${name}'
Category: '${category}'
Address: '${address}'

Respond with ONLY a valid JSON object matching this schema:
{
  "min": number,
  "max": number,
  "summary": string,
  "tip": string
}
Write the summary and tip in ${lang === "ja" ? "Japanese" : lang === "en" ? "English" : "Indonesian"}.
The numbers must be realistic integer amounts in Japanese Yen (e.g. min: 900, max: 1500).`;

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
