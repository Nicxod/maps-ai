import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  const lang = request.nextUrl.searchParams.get("lang") || "id";

  if (!query || query.length < 2 || query.length > 120) {
    return NextResponse.json({ error: "Masukkan lokasi yang lebih lengkap." }, { status: 400 });
  }

  const acceptLang = lang === "ja" ? "ja,en;q=0.8" : lang === "en" ? "en,ja;q=0.8" : "id,en;q=0.8,ja;q=0.5";

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=jp&q=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent": "NearMeJapanApp/1.0 (contact: support@nearme-japan.local)",
          "Accept-Language": acceptLang,
        },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) throw new Error();
    const rows = await response.json();
    if (!rows.length) {
      return NextResponse.json({ error: "Lokasi tidak ditemukan di Jepang." }, { status: 404 });
    }

    return NextResponse.json({
      lat: Number(rows[0].lat),
      lng: Number(rows[0].lon),
      label: rows[0].display_name,
    });
  } catch {
    return NextResponse.json(
      { error: "Pencarian lokasi gagal. Coba nama stasiun atau kota lain." },
      { status: 502 }
    );
  }
}
