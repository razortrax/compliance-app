import { NextRequest } from 'next/server'

// DISABLED - Related models removed from schema
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return Response.json({ error: 'Roadside inspection access disabled' }, { status: 501 })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return Response.json({ error: 'Roadside inspection update disabled' }, { status: 501 })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return Response.json({ error: 'Roadside inspection deletion disabled' }, { status: 501 })
} 