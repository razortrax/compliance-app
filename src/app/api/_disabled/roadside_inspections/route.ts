import { NextRequest } from "next/server";

// DISABLED - Roadside inspection models removed from schema
export async function GET(request: NextRequest) {
  return Response.json({ error: "Roadside inspections listing disabled" }, { status: 501 });
}

export async function POST(request: NextRequest) {
  return Response.json({ error: "Roadside inspection creation disabled" }, { status: 501 });
}
