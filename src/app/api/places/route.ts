import { NextRequest, NextResponse } from "next/server";
import { addWalkingRoutes, searchPlaces } from "@/lib/places";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const lat = Number(q.get("lat"));
  const lng = Number(q.get("lng"));
  const radius = Number(q.get("radius") ?? 1000);
  const category = q.get("category") ?? "food";
  const lang = q.get("lang") ?? "id";

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180 ||
    ![500, 1000, 2000, 5000].includes(radius)
  ) {
    return NextResponse.json({ error: "Lokasi atau radius tidak valid." }, { status: 400 });
  }

  try {
    const places = await searchPlaces(lat, lng, radius, category, lang);
    const withRoutes = await addWalkingRoutes({ lat, lng }, places);
    return NextResponse.json({ places: withRoutes });
  } catch {
    return NextResponse.json(
      { error: "Pencarian tempat sedang tidak tersedia. Coba lagi sebentar." },
      { status: 502 }
    );
  }
}
