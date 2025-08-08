import { NextRequest, NextResponse } from "next/server";
import { withApiError } from "@/lib/with-api-error";

// Lightweight proxy to Zippopotam.us to avoid CORS and allow future provider swaps
export const GET = withApiError("/api/zip-lookup", async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const zip = (searchParams.get("zip") || "").trim();
  const country = (searchParams.get("country") || "us").toLowerCase();

  if (!/^\d{5}(-\d{4})?$/.test(zip)) {
    return NextResponse.json({ error: "Invalid ZIP code" }, { status: 400 });
  }

  const baseZip = zip.slice(0, 5);
  const url = `https://api.zippopotam.us/${country}/${baseZip}`;

  const resp = await fetch(url, { cache: "no-store" });
  if (!resp.ok) {
    return NextResponse.json({ error: "ZIP not found" }, { status: 404 });
  }

  const data = await resp.json();
  const place = Array.isArray(data.places) && data.places.length > 0 ? data.places[0] : null;
  if (!place) {
    return NextResponse.json({ error: "No places for ZIP" }, { status: 404 });
  }

  return NextResponse.json({
    zip: baseZip,
    country: data["country abbreviation"] || country.toUpperCase(),
    city: place["place name"],
    state: place["state abbreviation"],
    stateName: place["state"],
    latitude: place["latitude"],
    longitude: place["longitude"],
  });
});


