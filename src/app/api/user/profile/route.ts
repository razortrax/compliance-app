import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find the user's person record
    const userPerson = await db.person.findFirst({
      where: {
        party: {
          userId: userId
        }
      },
      select: {
        firstName: true,
        lastName: true,
        email: true
      }
    })

    if (userPerson) {
      return NextResponse.json({
        profile: {
          firstName: userPerson.firstName,
          lastName: userPerson.lastName,
          email: userPerson.email
        }
      })
    }

    // No person record found
    return NextResponse.json({
      profile: null
    })

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch user profile' 
    }, { status: 500 })
  }
} 