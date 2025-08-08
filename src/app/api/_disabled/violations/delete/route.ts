import { NextRequest } from "next/server";

// DISABLED - Related models removed from schema
export async function DELETE(request: NextRequest) {
  return Response.json({ error: "Violation deletion disabled" }, { status: 501 });
}
