import { NextResponse } from "next/server";

export async function GET() {
  // Returns 404 so cards automatically display high-quality thematic placeholders without needing paid photo APIs
  return new NextResponse("Not found", { status: 404 });
}
