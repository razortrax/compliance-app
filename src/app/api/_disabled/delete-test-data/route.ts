import { NextRequest } from "next/server";

// DISABLED - Related models removed from schema
export async function DELETE(request: NextRequest) {
  return Response.json({ error: "Test data deletion disabled" }, { status: 501 });
}
