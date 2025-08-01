import { NextRequest } from 'next/server'

// DISABLED - Accident issue models removed from schema
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return Response.json({ error: 'Accident issue access disabled' }, { status: 501 })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return Response.json({ error: 'Accident issue update disabled' }, { status: 501 })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return Response.json({ error: 'Accident issue deletion disabled' }, { status: 501 })
} 