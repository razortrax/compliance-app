import { NextRequest } from "next/server";

// DISABLED - Related models removed from schema
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return Response.json({ error: "CAF access disabled" }, { status: 501 });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return Response.json({ error: "CAF update disabled" }, { status: 501 });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return Response.json({ error: "CAF deletion disabled" }, { status: 501 });
}
