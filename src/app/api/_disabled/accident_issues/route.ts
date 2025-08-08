import { NextRequest } from "next/server";

// DISABLED - Accident issue models removed from schema
export async function GET(request: NextRequest) {
  return Response.json({ error: "Accident issues listing disabled" }, { status: 501 });
}

export async function POST(request: NextRequest) {
  return Response.json({ error: "Accident issue creation disabled" }, { status: 501 });
}
