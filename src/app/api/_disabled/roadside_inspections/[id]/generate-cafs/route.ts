import { NextRequest } from 'next/server'

// DISABLED - Related models removed from schema
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return Response.json({ error: 'CAF generation disabled' }, { status: 501 })
} 