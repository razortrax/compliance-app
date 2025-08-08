import { NextRequest } from "next/server";

// DISABLED - Related models removed from schema
export async function GET(request: NextRequest) {
  return Response.json({ error: "Violation search disabled" }, { status: 501 });
}
