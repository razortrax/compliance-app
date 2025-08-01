import { NextRequest } from 'next/server'

// DISABLED - Related models removed from schema
export async function GET(request: NextRequest) {
  return Response.json({ error: 'CAF listing disabled' }, { status: 501 })
}

export async function POST(request: NextRequest) {
  return Response.json({ error: 'CAF creation disabled' }, { status: 501 })
} 