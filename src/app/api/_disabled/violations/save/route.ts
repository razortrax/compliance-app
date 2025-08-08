import { NextRequest } from "next/server";

// DISABLED - Related models removed from schema
export async function POST(request: NextRequest) {
  return Response.json({ error: "Violation saving disabled" }, { status: 501 });
}
